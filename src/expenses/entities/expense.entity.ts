import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';
import { Receipt } from './receipt.entity';
import {
  ExtractionStatus,
  ExpenseCategory,
  ExpenseSource,
  PaymentMethod,
} from '../enums/expense.enums';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  tripId!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => Trip, (trip) => trip.expenses, { onDelete: 'CASCADE' })
  trip!: Trip;

  @Column({ type: 'timestamp' })
  occurredAt!: Date;

  @Column({ nullable: true })
  merchantName?: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount!: number;

  @Column({ length: 3 })
  currency!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  baseAmount?: number;

  @Column({ length: 3, nullable: true })
  baseCurrency?: string;

  @Column({ type: 'numeric', precision: 10, scale: 6, nullable: true })
  exchangeRate?: number;

  @Column({ nullable: true })
  exchangeRateSource?: string;

  @Column({ type: 'timestamp', nullable: true })
  exchangeRateAt?: Date;

  @Column({ type: 'varchar', default: ExpenseCategory.Other })
  category!: ExpenseCategory;

  @Column({ type: 'varchar', default: PaymentMethod.Cash })
  paymentMethod!: PaymentMethod;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'varchar', default: ExpenseSource.Manual })
  source!: ExpenseSource;

  @Column({ type: 'varchar', default: ExtractionStatus.None })
  extractionStatus!: ExtractionStatus;

  @OneToMany(() => Receipt, (receipt) => receipt.expense)
  receipts?: Receipt[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt?: Date;
}
