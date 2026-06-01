import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { stringify } from 'csv-stringify/sync';
import { Trip } from '../trips/entities/trip.entity';
import { DeleteResponseDto } from '../common/dto/delete-response.dto';
import { Budget } from './entities/budget.entity';
import { Expense } from './entities/expense.entity';
import { Receipt } from './entities/receipt.entity';
import { TripParticipant } from './entities/trip-participant.entity';
import { ExpenseIncludedParticipant } from './entities/expense-included-participant.entity';
import { BudgetResponseDto } from './dto/budget-response.dto';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseDashboardResponseDto } from './dto/expense-dashboard-response.dto';
import { ExpenseFiltersQueryDto } from './dto/expense-filters-query.dto';
import { ExpenseResponseDto } from './dto/expense-response.dto';
import { ExpenseSummaryQueryDto } from './dto/expense-summary-query.dto';
import { ExpenseSummaryResponseDto } from './dto/expense-summary-response.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { SetExpenseSplitDto } from './dto/set-expense-split.dto';
import { ParticipantService } from './services/participant.service';
import { CurrencyConverterService } from './services/currency-converter.service';
import {
  ExtractedReceipt,
  OcrExtractionService,
} from './services/ocr-extraction.service';
import {
  ExpenseCategory,
  ExpenseSource,
  ExtractionStatus,
  PaymentMethod,
} from './enums/expense.enums';

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(Receipt)
    private readonly receiptRepository: Repository<Receipt>,
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>,
    @InjectRepository(Trip)
    private readonly tripsRepository: Repository<Trip>,
    @InjectRepository(TripParticipant)
    private readonly participantRepository: Repository<TripParticipant>,
    @InjectRepository(ExpenseIncludedParticipant)
    private readonly eipRepository: Repository<ExpenseIncludedParticipant>,
    private readonly currencyConverter: CurrencyConverterService,
    private readonly ocrService: OcrExtractionService,
    private readonly participantService: ParticipantService,
  ) {}

  async findAll(
    tripId: string,
    userId: string,
    filters?: ExpenseFiltersQueryDto,
  ): Promise<ExpenseResponseDto[]> {
    // Ownership check
    await this.getTripWithOwnershipCheck(tripId, userId);

    const query = this.expenseRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.receipts', 'receipt')
      .leftJoinAndSelect('expense.paidByParticipant', 'paidByParticipant')
      .leftJoinAndSelect('expense.includedParticipants', 'eip')
      .leftJoinAndSelect('eip.participant', 'eipParticipant')
      .where('expense.tripId = :tripId', { tripId })
      .andWhere('expense.deletedAt IS NULL');

    if (filters?.category) {
      query.andWhere('expense.category = :category', {
        category: filters.category,
      });
    }

    if (filters?.paymentMethod) {
      query.andWhere('expense.paymentMethod = :paymentMethod', {
        paymentMethod: filters.paymentMethod,
      });
    }

    if (filters?.currency) {
      query.andWhere('expense.currency = :currency', {
        currency: filters.currency,
      });
    }

    if (filters?.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      query.andWhere('expense.occurredAt >= :dateFrom', { dateFrom: fromDate });
    }

    if (filters?.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      query.andWhere('expense.occurredAt <= :dateTo', { dateTo: toDate });
    }

    if (filters?.extractionStatus) {
      query.andWhere('expense.extractionStatus = :extractionStatus', {
        extractionStatus: filters.extractionStatus,
      });
    }

    query.orderBy('expense.occurredAt', 'DESC');

    const expenses = await query.getMany();
    return expenses.map((e) => this.toExpenseResponse(e));
  }

  async findOne(
    tripId: string,
    id: string,
    userId: string,
  ): Promise<ExpenseResponseDto> {
    // Ownership check
    await this.getTripWithOwnershipCheck(tripId, userId);

    const expense = await this.expenseRepository.findOne({
      where: { id, tripId, deletedAt: IsNull() },
      relations: ['receipts'],
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return this.toExpenseResponse(expense);
  }

  async create(
    tripId: string,
    dto: CreateExpenseDto,
    userId: string,
  ): Promise<ExpenseResponseDto> {
    const trip = await this.getTripWithOwnershipCheck(tripId, userId);

    const expense = this.expenseRepository.create({
      ...dto,
      tripId,
      userId,
      occurredAt: new Date(dto.occurredAt),
    });

    // Auto-convert if currency differs from trip base currency
    if (trip.baseCurrency && dto.currency !== trip.baseCurrency) {
      const conversion = await this.currencyConverter.convert(
        expense.amount as any,
        dto.currency,
        trip.baseCurrency,
      );
      expense.baseAmount = conversion.baseAmount;
      expense.baseCurrency = trip.baseCurrency;
      expense.exchangeRate = conversion.exchangeRate;
      expense.exchangeRateSource = conversion.source;
      expense.exchangeRateAt = conversion.rateAt;
    } else if (trip.baseCurrency) {
      expense.baseAmount = expense.amount;
      expense.baseCurrency = trip.baseCurrency;
      expense.exchangeRate = 1.0;
    }

    const saved = await this.expenseRepository.save(expense);
    return this.toExpenseResponse(saved);
  }

  async update(
    tripId: string,
    id: string,
    dto: UpdateExpenseDto,
    userId: string,
  ): Promise<ExpenseResponseDto> {
    const trip = await this.getTripWithOwnershipCheck(tripId, userId);

    const expense = await this.expenseRepository.findOne({
      where: { id, tripId, deletedAt: IsNull() },
      relations: ['receipts'],
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    Object.assign(expense, dto);

    if (dto.occurredAt) {
      expense.occurredAt = new Date(dto.occurredAt);
    }
    if ((dto.amount || dto.currency) && trip.baseCurrency) {
      const amt = dto.amount ?? (expense.amount as any);
      const curr = dto.currency ?? expense.currency;
      if (curr !== trip.baseCurrency) {
        const conversion = await this.currencyConverter.convert(
          amt,
          curr,
          trip.baseCurrency,
        );
        expense.baseAmount = conversion.baseAmount;
        expense.baseCurrency = trip.baseCurrency;
        expense.exchangeRate = conversion.exchangeRate;
        expense.exchangeRateSource = conversion.source;
        expense.exchangeRateAt = conversion.rateAt;
      }
    }

    const saved = await this.expenseRepository.save(expense);
    return this.toExpenseResponse(saved);
  }

  async remove(
    tripId: string,
    id: string,
    userId: string,
  ): Promise<DeleteResponseDto> {
    // Ownership check
    await this.getTripWithOwnershipCheck(tripId, userId);

    const expense = await this.expenseRepository.findOne({
      where: { id, tripId, deletedAt: IsNull() },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    await this.expenseRepository.softDelete(id);
    return { deleted: true, id };
  }

  async uploadReceipt(
    tripId: string,
    id: string,
    file: any,
    userId: string,
  ): Promise<any> {
    // Ownership check
    await this.getTripWithOwnershipCheck(tripId, userId);

    const expense = await this.expenseRepository.findOne({
      where: { id, tripId, deletedAt: IsNull() },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    const fileUrl = `/uploads/receipts/${Date.now()}-${file.originalname}`;

    const receipt = this.receiptRepository.create({
      expenseId: id,
      fileUrl,
      mimeType: file.mimetype,
      fileSize: file.size,
      uploadedAt: new Date(),
    });

    const saved = await this.receiptRepository.save(receipt);

    // Set status to pending before kicking off OCR
    expense.extractionStatus = ExtractionStatus.Pending;
    await this.expenseRepository.save(expense);

    // Fire-and-forget OCR extraction
    this.ocrService
      .extractFromImage(file.buffer, file.mimetype)
      .then(async (extracted) => {
        saved.rawOcrJson = extracted as unknown as Record<string, unknown>;
        saved.confidenceScore = this.mapOcrConfidenceScore(
          extracted.confidence,
        );
        await this.receiptRepository.save(saved);

        expense.extractionStatus = ExtractionStatus.Success;
        await this.expenseRepository.save(expense);

        this.logger.debug(`OCR extraction success for receipt ${saved.id}`);
      })
      .catch(async (err: unknown) => {
        expense.extractionStatus = ExtractionStatus.Failed;
        await this.expenseRepository.save(expense);
        this.logger.error(`OCR extraction failed for receipt ${saved.id}`, err);
      });

    return this.toReceiptResponse(saved);
  }

  async removeReceipt(
    receiptId: string,
    userId: string,
  ): Promise<DeleteResponseDto> {
    const receipt = await this.receiptRepository.findOne({
      where: { id: receiptId },
      relations: ['expense', 'expense.trip'],
    });

    if (!receipt || receipt.expense.trip.userId !== userId) {
      throw new NotFoundException('Receipt not found');
    }

    // TODO: Delete file from disk at receipt.fileUrl
    // For now, just remove DB record
    await this.receiptRepository.remove(receipt);

    return { deleted: true, id: receiptId };
  }

  async getSummary(
    tripId: string,
    userId: string,
    query: ExpenseSummaryQueryDto,
  ): Promise<ExpenseSummaryResponseDto> {
    const trip = await this.getTripWithOwnershipCheck(tripId, userId);

    // Fetch all expenses matching filters
    const expenses = await this.findAll(tripId, userId, query);

    const needsReviewCount = await this.expenseRepository.count({
      where: {
        tripId,
        extractionStatus: ExtractionStatus.NeedsReview,
        deletedAt: IsNull(),
      },
    });

    if (expenses.length === 0) {
      return {
        totalSpent: 0,
        baseCurrency: trip.baseCurrency || 'USD',
        transactionCount: 0,
        averagePerDay: 0,
        byCategory: [],
        byMerchant: [],
        dailyTrend: [],
        needsReviewCount,
      };
    }

    const totalSpent = expenses.reduce(
      (sum, e) => sum + Number(e.baseAmount || e.amount || 0),
      0,
    );

    const uniqueDays = new Set(
      expenses.map((e) => e.occurredAt?.toISOString().split('T')[0] ?? ''),
    ).size;
    const avgPerDay = uniqueDays > 0 ? Math.round(totalSpent / uniqueDays) : 0;

    // Category breakdown
    const categoryMap = new Map<string, { amount: number; count: number }>();
    expenses.forEach((e) => {
      const cat = e.category;
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { amount: 0, count: 0 });
      }
      const entry = categoryMap.get(cat)!;
      entry.amount += Number(e.baseAmount || e.amount || 0);
      entry.count += 1;
    });

    const byCategory = Array.from(categoryMap.entries()).map(
      ([category, { amount, count }]) => ({
        category,
        amount: Math.round(amount * 100) / 100,
        percentage:
          totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
        count,
      }),
    );

    // Merchant breakdown
    const merchantMap = new Map<string, { amount: number; count: number }>();
    expenses.forEach((e) => {
      const merchant = e.merchantName || 'Unknown';
      if (!merchantMap.has(merchant)) {
        merchantMap.set(merchant, { amount: 0, count: 0 });
      }
      const entry = merchantMap.get(merchant)!;
      entry.amount += Number(e.baseAmount || e.amount || 0);
      entry.count += 1;
    });

    const byMerchant = Array.from(merchantMap.entries())
      .map(([merchantName, { amount, count }]) => ({
        merchantName,
        amount: Math.round(amount * 100) / 100,
        count,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Top 10 merchants

    // Daily trend
    const dailyMap = new Map<string, number>();
    expenses.forEach((e) => {
      const dateStr = e.occurredAt?.toISOString().split('T')[0] || '';
      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, 0);
      }
      dailyMap.set(
        dateStr,
        dailyMap.get(dateStr)! + Number(e.baseAmount || e.amount || 0),
      );
    });

    const dailyTrend = Array.from(dailyMap.entries())
      .map(([date, amount]) => ({
        date,
        amount: Math.round(amount * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalSpent: Math.round(totalSpent * 100) / 100,
      baseCurrency: trip.baseCurrency || 'USD',
      transactionCount: expenses.length,
      averagePerDay: avgPerDay,
      byCategory,
      byMerchant,
      dailyTrend,
      needsReviewCount,
    };
  }

  async getDashboard(
    tripId: string,
    userId: string,
  ): Promise<ExpenseDashboardResponseDto> {
    const [summary, budget] = await Promise.all([
      this.getSummary(tripId, userId, {}),
      this.budgetRepository.findOne({ where: { tripId } }).then(async (b) => {
        if (!b) return null;
        const result = await this.expenseRepository
          .createQueryBuilder('expense')
          .select(
            'SUM(CAST(COALESCE(expense.baseAmount, expense.amount) AS float))',
            'total',
          )
          .where('expense.tripId = :tripId', { tripId })
          .andWhere('expense.deletedAt IS NULL')
          .getRawOne<{ total: string }>();
        const spent = parseFloat(result?.total ?? '0') || 0;
        const totalAmount = Number(b.totalAmount);
        return {
          ...b,
          totalAmount,
          spent,
          remaining: totalAmount - spent,
          percentageUsed:
            totalAmount > 0 ? Math.round((spent / totalAmount) * 100) : 0,
        } as BudgetResponseDto;
      }),
    ]);

    return { summary, budget };
  }

  async getBudget(tripId: string, userId: string): Promise<BudgetResponseDto> {
    await this.getTripWithOwnershipCheck(tripId, userId);

    const budget = await this.budgetRepository.findOne({ where: { tripId } });

    if (!budget) {
      throw new NotFoundException('Budget not found for this trip');
    }

    // Compute spent via SUM of COALESCE(baseAmount, amount)
    const result = await this.expenseRepository
      .createQueryBuilder('expense')
      .select(
        'SUM(CAST(COALESCE(expense.baseAmount, expense.amount) AS float))',
        'total',
      )
      .where('expense.tripId = :tripId', { tripId })
      .andWhere('expense.deletedAt IS NULL')
      .getRawOne();

    const spent = parseFloat(result.total || 0) || 0;
    const totalAmount = Number(budget.totalAmount);
    const remaining = totalAmount - spent;
    const percentageUsed =
      totalAmount > 0 ? Math.round((spent / totalAmount) * 100) : 0;

    return {
      ...budget,
      totalAmount,
      spent,
      remaining,
      percentageUsed,
    };
  }

  async createBudget(
    tripId: string,
    dto: CreateBudgetDto,
    userId: string,
  ): Promise<BudgetResponseDto> {
    const trip = await this.getTripWithOwnershipCheck(tripId, userId);

    const budget = this.budgetRepository.create({
      ...dto,
      tripId,
    });

    const saved = await this.budgetRepository.save(budget);
    const result = await this.expenseRepository
      .createQueryBuilder('expense')
      .select(
        'SUM(CAST(COALESCE(expense.baseAmount, expense.amount) AS float))',
        'total',
      )
      .where('expense.tripId = :tripId', { tripId })
      .andWhere('expense.deletedAt IS NULL')
      .getRawOne();

    const spent = parseFloat(result.total || 0) || 0;
    const totalAmount = Number(saved.totalAmount);
    return {
      ...saved,
      totalAmount,
      spent,
      remaining: totalAmount - spent,
      percentageUsed:
        totalAmount > 0 ? Math.round((spent / totalAmount) * 100) : 0,
    };
  }

  async updateBudget(
    tripId: string,
    dto: UpdateBudgetDto,
    userId: string,
  ): Promise<BudgetResponseDto> {
    const trip = await this.getTripWithOwnershipCheck(tripId, userId);

    const budget = await this.budgetRepository.findOne({ where: { tripId } });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    Object.assign(budget, dto);
    const saved = await this.budgetRepository.save(budget);

    const result = await this.expenseRepository
      .createQueryBuilder('expense')
      .select(
        'SUM(CAST(COALESCE(expense.baseAmount, expense.amount) AS float))',
        'total',
      )
      .where('expense.tripId = :tripId', { tripId })
      .andWhere('expense.deletedAt IS NULL')
      .getRawOne();

    const spent = parseFloat(result.total || 0) || 0;
    const totalAmount = Number(saved.totalAmount);
    return {
      ...saved,
      totalAmount,
      spent,
      remaining: totalAmount - spent,
      percentageUsed:
        totalAmount > 0 ? Math.round((spent / totalAmount) * 100) : 0,
    };
  }

  async deleteBudget(
    tripId: string,
    userId: string,
  ): Promise<DeleteResponseDto> {
    const trip = await this.getTripWithOwnershipCheck(tripId, userId);

    const budget = await this.budgetRepository.findOne({ where: { tripId } });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    await this.budgetRepository.remove(budget);
    return { deleted: true, id: budget.id };
  }

  async exportCsv(
    tripId: string,
    userId: string,
    query: ExpenseSummaryQueryDto,
  ): Promise<string> {
    const expenses = await this.findAll(tripId, userId, query);

    const rows = expenses.map((e) => [
      e.occurredAt?.toISOString().split('T')[0] || '',
      e.merchantName || '',
      e.category,
      e.paymentMethod,
      e.amount,
      e.currency,
      e.baseAmount || '',
      e.baseCurrency || '',
      e.notes || '',
      e.receipt ? 'yes' : 'no',
    ]);

    const csv = stringify(rows, {
      header: false,
      columns: [
        'date',
        'merchant',
        'category',
        'payment_method',
        'amount',
        'currency',
        'base_amount',
        'base_currency',
        'notes',
        'has_receipt',
      ],
    });

    return csv;
  }

  async checkDuplicate(
    tripId: string,
    dto: CreateExpenseDto,
  ): Promise<{ isDuplicate: boolean; candidateId?: string }> {
    // Simple heuristic: same merchant + amount + currency within ±1 day
    const occurredAt = new Date(dto.occurredAt);
    const minDate = new Date(occurredAt.getTime() - 24 * 60 * 60 * 1000);
    const maxDate = new Date(occurredAt.getTime() + 24 * 60 * 60 * 1000);

    const candidate = await this.expenseRepository.findOne({
      where: {
        tripId,
        merchantName: dto.merchantName,
        amount: dto.amount,
        currency: dto.currency,
        deletedAt: IsNull(),
      },
      order: { occurredAt: 'DESC' },
    });

    if (
      candidate &&
      candidate.occurredAt >= minDate &&
      candidate.occurredAt <= maxDate
    ) {
      return { isDuplicate: true, candidateId: candidate.id };
    }

    return { isDuplicate: false };
  }

  async createFromReceipt(
    tripId: string,
    file: Express.Multer.File,
    userId: string,
  ): Promise<ExpenseResponseDto> {
    const trip = await this.getTripWithOwnershipCheck(tripId, userId);

    const extracted = await this.ocrService.extractFromImage(
      file.buffer,
      file.mimetype as 'image/jpeg' | 'image/png' | 'image/webp',
    );

    if (!extracted.totalAmount || !extracted.currency) {
      throw new BadRequestException(
        'Could not extract amount or currency from receipt. Please enter the expense manually.',
      );
    }

    const extractionStatus =
      extracted.confidence === 'high'
        ? ExtractionStatus.Success
        : ExtractionStatus.NeedsReview;

    const expense = this.expenseRepository.create({
      tripId,
      userId,
      amount: extracted.totalAmount,
      currency: extracted.currency,
      merchantName: extracted.merchantName ?? undefined,
      occurredAt: extracted.date ? new Date(extracted.date) : new Date(),
      paymentMethod: this.mapOcrPaymentMethod(extracted.paymentMethod),
      category: ExpenseCategory.Other,
      source: ExpenseSource.Ocr,
      extractionStatus,
    });

    if (trip.baseCurrency && extracted.currency !== trip.baseCurrency) {
      const conversion = await this.currencyConverter.convert(
        expense.amount as any,
        extracted.currency,
        trip.baseCurrency,
      );
      expense.baseAmount = conversion.baseAmount;
      expense.baseCurrency = trip.baseCurrency;
      expense.exchangeRate = conversion.exchangeRate;
      expense.exchangeRateSource = conversion.source;
      expense.exchangeRateAt = conversion.rateAt;
    } else if (trip.baseCurrency) {
      expense.baseAmount = expense.amount;
      expense.baseCurrency = trip.baseCurrency;
      expense.exchangeRate = 1.0;
    }

    const savedExpense = await this.expenseRepository.save(expense);

    const fileUrl = `/uploads/receipts/${Date.now()}-${file.originalname}`;
    const receipt = this.receiptRepository.create({
      expenseId: savedExpense.id,
      fileUrl,
      mimeType: file.mimetype,
      fileSize: file.size,
      uploadedAt: new Date(),
      rawOcrJson: extracted as unknown as Record<string, unknown>,
      confidenceScore: this.mapOcrConfidenceScore(extracted.confidence),
    });
    const savedReceipt = await this.receiptRepository.save(receipt);

    return this.toExpenseResponse({
      ...savedExpense,
      receipts: [savedReceipt],
    } as Expense);
  }

  async setSplit(
    tripId: string,
    expenseId: string,
    userId: string,
    dto: SetExpenseSplitDto,
  ): Promise<ExpenseResponseDto> {
    await this.getTripWithOwnershipCheck(tripId, userId);

    const expense = await this.expenseRepository.findOne({
      where: { id: expenseId, tripId, deletedAt: IsNull() },
      relations: ['receipts'],
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    // Validate payer belongs to this trip
    const payer = await this.participantRepository.findOne({
      where: { id: dto.paidByParticipantId, tripId },
    });

    if (!payer) {
      throw new NotFoundException('Payer participant not found in this trip');
    }

    // Validate all included participants belong to this trip
    const included = await this.participantRepository
      .createQueryBuilder('p')
      .where('p.id IN (:...ids)', { ids: dto.includedParticipantIds })
      .andWhere('p.tripId = :tripId', { tripId })
      .getMany();

    if (included.length !== dto.includedParticipantIds.length) {
      throw new NotFoundException(
        'One or more included participants not found in this trip',
      );
    }

    // Update expense split fields
    expense.paidByParticipantId = dto.paidByParticipantId;
    expense.splitMode = dto.splitMode;

    await this.expenseRepository.save(expense);

    // Replace included participants junction records
    await this.eipRepository.delete({ expenseId });

    const eips = included.map((p) =>
      this.eipRepository.create({ expenseId, participantId: p.id }),
    );
    await this.eipRepository.save(eips);

    // Re-fetch with all relations for response
    const updated = await this.expenseRepository.findOne({
      where: { id: expenseId },
      relations: [
        'receipts',
        'paidByParticipant',
        'includedParticipants',
        'includedParticipants.participant',
      ],
    });

    return this.toExpenseResponse(updated!);
  }

  /**
   * Get trip by ID and verify ownership.
   */
  private async getTripWithOwnershipCheck(
    tripId: string,
    userId: string,
  ): Promise<Trip> {
    const trip = await this.tripsRepository.findOne({
      where: { id: tripId, userId },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    return trip;
  }

  // Private mappers
  private mapOcrPaymentMethod(method: string | null): PaymentMethod {
    switch (method) {
      case 'credit_card':
        return PaymentMethod.CreditCard;
      case 'debit_card':
        return PaymentMethod.DebitCard;
      case 'cash':
        return PaymentMethod.Cash;
      case 'contactless':
        return PaymentMethod.CreditCard;
      default:
        return PaymentMethod.Other;
    }
  }

  private mapOcrConfidenceScore(
    confidence: ExtractedReceipt['confidence'],
  ): number {
    switch (confidence) {
      case 'high':
        return 1.0;
      case 'medium':
        return 0.5;
      case 'low':
        return 0.2;
    }
  }

  private toExpenseResponse(expense: Expense): ExpenseResponseDto {
    return {
      id: expense.id,
      tripId: expense.tripId,
      occurredAt: expense.occurredAt,
      merchantName: expense.merchantName,
      amount: expense.amount != null ? Number(expense.amount) : expense.amount,
      currency: expense.currency,
      baseAmount:
        expense.baseAmount != null ? Number(expense.baseAmount) : undefined,
      baseCurrency: expense.baseCurrency,
      exchangeRate:
        expense.exchangeRate != null ? Number(expense.exchangeRate) : undefined,
      exchangeRateSource: expense.exchangeRateSource,
      exchangeRateAt: expense.exchangeRateAt,
      category: expense.category,
      paymentMethod: expense.paymentMethod,
      notes: expense.notes,
      source: expense.source,
      extractionStatus: expense.extractionStatus,
      receipt: expense.receipts?.[0]
        ? this.toReceiptResponse(expense.receipts[0])
        : undefined,
      paidByParticipant: expense.paidByParticipant
        ? this.participantService.toParticipantResponse(
            expense.paidByParticipant,
          )
        : undefined,
      splitMode: expense.splitMode as any,
      expenseEndDate: expense.expenseEndDate,
      includedParticipants: expense.includedParticipants?.map((eip) =>
        this.participantService.toParticipantResponse(eip.participant),
      ),
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    };
  }

  private toReceiptResponse(receipt: Receipt): any {
    return {
      id: receipt.id,
      expenseId: receipt.expenseId,
      fileUrl: receipt.fileUrl,
      thumbnailUrl: receipt.thumbnailUrl,
      mimeType: receipt.mimeType,
      fileSize: receipt.fileSize,
      uploadedAt: receipt.uploadedAt,
      rawOcrJson: receipt.rawOcrJson,
      confidenceScore: receipt.confidenceScore,
      createdAt: receipt.createdAt,
      updatedAt: receipt.updatedAt,
    };
  }
}
