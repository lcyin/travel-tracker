import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { CurrencyConverterService } from './services/currency-converter.service';
import { OcrExtractionService } from './services/ocr-extraction.service';
import { Budget } from './entities/budget.entity';
import { Expense } from './entities/expense.entity';
import { Receipt } from './entities/receipt.entity';
import { Trip } from '../trips/entities/trip.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Expense, Receipt, Budget, Trip])],
  controllers: [ExpensesController],
  providers: [ExpensesService, CurrencyConverterService, OcrExtractionService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
