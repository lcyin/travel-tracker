import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';
import { DeleteResponseDto } from '../../common/dto/delete-response.dto';
import { Expense } from '../entities/expense.entity';
import { TripParticipant } from '../entities/trip-participant.entity';
import { CreateParticipantDto } from '../dto/create-participant.dto';
import { ParticipantResponseDto } from '../dto/participant-response.dto';
import { UpdateParticipantDto } from '../dto/update-participant.dto';

@Injectable()
export class ParticipantService {
  private readonly logger = new Logger(ParticipantService.name);

  constructor(
    @InjectRepository(TripParticipant)
    private readonly participantRepository: Repository<TripParticipant>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
  ) {}

  async create(
    tripId: string,
    userId: string,
    dto: CreateParticipantDto,
  ): Promise<ParticipantResponseDto> {
    await this.getTripWithOwnershipCheck(tripId, userId);

    if (dto.stayEnd <= dto.stayStart) {
      throw new BadRequestException('stayEnd must be after stayStart');
    }

    const participant = this.participantRepository.create({
      tripId,
      name: dto.name,
      stayStart: dto.stayStart,
      stayEnd: dto.stayEnd,
    });

    const saved = await this.participantRepository.save(participant);
    return this.toParticipantResponse(saved);
  }

  async findAll(
    tripId: string,
    userId: string,
  ): Promise<ParticipantResponseDto[]> {
    await this.getTripWithOwnershipCheck(tripId, userId);

    const participants = await this.participantRepository.find({
      where: { tripId },
      order: { stayStart: 'ASC', name: 'ASC' },
    });

    return participants.map((p) => this.toParticipantResponse(p));
  }

  async findOne(
    tripId: string,
    participantId: string,
    userId: string,
  ): Promise<ParticipantResponseDto> {
    await this.getTripWithOwnershipCheck(tripId, userId);

    const participant = await this.participantRepository.findOne({
      where: { id: participantId, tripId },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    return this.toParticipantResponse(participant);
  }

  async update(
    tripId: string,
    participantId: string,
    userId: string,
    dto: UpdateParticipantDto,
  ): Promise<ParticipantResponseDto> {
    await this.getTripWithOwnershipCheck(tripId, userId);

    const participant = await this.participantRepository.findOne({
      where: { id: participantId, tripId },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    const newStart = dto.stayStart ?? participant.stayStart;
    const newEnd = dto.stayEnd ?? participant.stayEnd;

    if (newEnd <= newStart) {
      throw new BadRequestException('stayEnd must be after stayStart');
    }

    Object.assign(participant, dto);
    const saved = await this.participantRepository.save(participant);
    return this.toParticipantResponse(saved);
  }

  async remove(
    tripId: string,
    participantId: string,
    userId: string,
  ): Promise<DeleteResponseDto> {
    await this.getTripWithOwnershipCheck(tripId, userId);

    const participant = await this.participantRepository.findOne({
      where: { id: participantId, tripId },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    // Clear paidByParticipantId on related expenses (SET NULL is handled by FK,
    // but we also null-out in-memory before the DB cascade resolves on next query)
    await this.expenseRepository
      .createQueryBuilder()
      .update(Expense)
      .set({ paidByParticipantId: undefined })
      .where(
        'tripId = :tripId AND paidByParticipantId = :participantId AND deletedAt IS NULL',
        { tripId, participantId },
      )
      .execute();

    await this.participantRepository.remove(participant);

    this.logger.log(`Removed participant ${participantId} from trip ${tripId}`);
    return { deleted: true, id: participantId };
  }

  toParticipantResponse(participant: TripParticipant): ParticipantResponseDto {
    return {
      id: participant.id,
      tripId: participant.tripId,
      name: participant.name,
      stayStart: participant.stayStart,
      stayEnd: participant.stayEnd,
      createdAt: participant.createdAt,
      updatedAt: participant.updatedAt,
    };
  }

  private async getTripWithOwnershipCheck(
    tripId: string,
    userId: string,
  ): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { id: tripId, userId },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    return trip;
  }
}
