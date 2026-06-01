import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';
import { Expense } from '../entities/expense.entity';
import { TripParticipant } from '../entities/trip-participant.entity';
import { ParticipantResponseDto } from '../dto/participant-response.dto';
import {
  ParticipantBalanceDto,
  SettlementPaymentDto,
  SettlementResponseDto,
} from '../dto/settlement-response.dto';
import { ParticipantService } from './participant.service';

@Injectable()
export class SettlementService {
  private readonly logger = new Logger(SettlementService.name);

  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(TripParticipant)
    private readonly participantRepository: Repository<TripParticipant>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    private readonly participantService: ParticipantService,
  ) {}

  async calculateSettlements(
    tripId: string,
    userId: string,
  ): Promise<SettlementResponseDto> {
    const trip = await this.tripRepository.findOne({
      where: { id: tripId, userId },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const participants = await this.participantRepository.find({
      where: { tripId },
    });

    const expenses = await this.expenseRepository.find({
      where: {
        tripId,
        deletedAt: IsNull(),
      },
      relations: ['includedParticipants', 'includedParticipants.participant'],
    });

    // Only consider expenses that have split configuration
    const splitExpenses = expenses.filter(
      (e) =>
        e.paidByParticipantId && e.splitMode && e.includedParticipants?.length,
    );

    // Accumulate paid and share amounts per participant
    const paidMap = new Map<string, number>();
    const shareMap = new Map<string, number>();

    for (const p of participants) {
      paidMap.set(p.id, 0);
      shareMap.set(p.id, 0);
    }

    for (const expense of splitExpenses) {
      const baseAmount = Number(expense.baseAmount ?? expense.amount ?? 0);
      if (baseAmount === 0) continue;

      const payerId = expense.paidByParticipantId!;
      paidMap.set(payerId, (paidMap.get(payerId) ?? 0) + baseAmount);

      const included = expense.includedParticipants!;
      const shares = this.computeShares(expense, included, participants);

      for (const [participantId, share] of shares.entries()) {
        shareMap.set(participantId, (shareMap.get(participantId) ?? 0) + share);
      }
    }

    // Build balances
    const balances: ParticipantBalanceDto[] = participants.map((p) => {
      const paid = Math.round((paidMap.get(p.id) ?? 0) * 100) / 100;
      const share = Math.round((shareMap.get(p.id) ?? 0) * 100) / 100;
      return {
        participant: this.participantService.toParticipantResponse(p),
        paid,
        share,
        net: Math.round((paid - share) * 100) / 100,
      };
    });

    const payments = this.minimizeSettlements(balances);

    return {
      balances,
      payments,
      currency: trip.baseCurrency ?? 'USD',
    };
  }

  /**
   * Compute per-participant shares for a single expense.
   * Returns a map of participantId → share amount.
   */
  private computeShares(
    expense: Expense,
    included: Expense['includedParticipants'] & {},
    allParticipants: TripParticipant[],
  ): Map<string, number> {
    const baseAmount = Number(expense.baseAmount ?? expense.amount ?? 0);
    const shares = new Map<string, number>();

    if (expense.splitMode === 'equal') {
      const count = included.length;
      const sharePerPerson = count > 0 ? baseAmount / count : 0;
      for (const eip of included) {
        shares.set(eip.participantId, sharePerPerson);
      }
      return shares;
    }

    if (expense.splitMode === 'by_stay_days') {
      const expenseStart = expense.occurredAt
        ? expense.occurredAt.toISOString().split('T')[0]
        : null;
      const expenseEnd = expense.expenseEndDate ?? expenseStart ?? null;

      const participantMap = new Map(allParticipants.map((p) => [p.id, p]));
      const nightsPerPerson = new Map<string, number>();
      let totalNights = 0;

      for (const eip of included) {
        const participant = participantMap.get(eip.participantId);
        if (!participant || !expenseStart || !expenseEnd) {
          nightsPerPerson.set(eip.participantId, 0);
          continue;
        }

        const overlapNights = this.computeOverlapNights(
          participant.stayStart,
          participant.stayEnd,
          expenseStart,
          expenseEnd,
        );
        nightsPerPerson.set(eip.participantId, overlapNights);
        totalNights += overlapNights;
      }

      if (totalNights > 0) {
        for (const eip of included) {
          const nights = nightsPerPerson.get(eip.participantId) ?? 0;
          shares.set(eip.participantId, baseAmount * (nights / totalNights));
        }
      } else {
        // Fallback to equal split when no overlap detected
        const count = included.length;
        const sharePerPerson = count > 0 ? baseAmount / count : 0;
        for (const eip of included) {
          shares.set(eip.participantId, sharePerPerson);
        }
      }

      return shares;
    }

    // Unknown split mode: return empty (no shares assigned)
    return shares;
  }

  /**
   * Compute the number of nights a person's stay overlaps with an expense period.
   * All dates are ISO 8601 strings (YYYY-MM-DD).
   * A "night" is counted as each day except the checkout day.
   */
  private computeOverlapNights(
    stayStart: string,
    stayEnd: string,
    expenseStart: string,
    expenseEnd: string,
  ): number {
    const overlapStart = stayStart > expenseStart ? stayStart : expenseStart;
    const overlapEnd = stayEnd < expenseEnd ? stayEnd : expenseEnd;

    if (overlapStart >= overlapEnd) return 0;

    const msPerDay = 24 * 60 * 60 * 1000;
    const nights = Math.round(
      (new Date(overlapEnd).getTime() - new Date(overlapStart).getTime()) /
        msPerDay,
    );
    return Math.max(0, nights);
  }

  /**
   * Greedy settlement minimization algorithm (§5.2 of spec).
   * Matches the largest debtor with the largest creditor iteratively.
   */
  private minimizeSettlements(
    balances: ParticipantBalanceDto[],
  ): SettlementPaymentDto[] {
    const EPSILON = 0.01;
    const payments: SettlementPaymentDto[] = [];

    const creditors = balances
      .filter((b) => b.net > EPSILON)
      .map((b) => ({ participant: b.participant, amount: b.net }))
      .sort((a, b) => b.amount - a.amount);

    const debtors = balances
      .filter((b) => b.net < -EPSILON)
      .map((b) => ({ participant: b.participant, amount: -b.net }))
      .sort((a, b) => b.amount - a.amount);

    let ci = 0;
    let di = 0;

    while (ci < creditors.length && di < debtors.length) {
      const creditor = creditors[ci];
      const debtor = debtors[di];

      const amount = Math.min(creditor.amount, debtor.amount);
      const roundedAmount = Math.round(amount * 100) / 100;

      if (roundedAmount >= EPSILON) {
        payments.push({
          from: debtor.participant,
          to: creditor.participant,
          amount: roundedAmount,
        });
      }

      creditor.amount -= amount;
      debtor.amount -= amount;

      if (creditor.amount < EPSILON) ci++;
      if (debtor.amount < EPSILON) di++;
    }

    return payments;
  }
}
