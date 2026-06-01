import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { CurrencyConverterService } from './services/currency-converter.service';
import { OcrExtractionService } from './services/ocr-extraction.service';
import { ParticipantService } from './services/participant.service';
import { SettlementService } from './services/settlement.service';
import { Budget } from './entities/budget.entity';
import { Expense } from './entities/expense.entity';
import { Receipt } from './entities/receipt.entity';
import { TripParticipant } from './entities/trip-participant.entity';
import { ExpenseIncludedParticipant } from './entities/expense-included-participant.entity';
import { Trip } from '../trips/entities/trip.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Expense,
      Receipt,
      Budget,
      Trip,
      TripParticipant,
      ExpenseIncludedParticipant,
    ]),
  ],
  controllers: [ExpensesController],
  providers: [
    ExpensesService,
    CurrencyConverterService,
    OcrExtractionService,
    ParticipantService,
    SettlementService,
  ],
  exports: [ExpensesService],
})
export class ExpensesModule {}
