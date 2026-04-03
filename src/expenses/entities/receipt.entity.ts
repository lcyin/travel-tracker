import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Expense } from './expense.entity';

@Entity('receipts')
export class Receipt {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  expenseId!: string;

  @ManyToOne(() => Expense, (expense) => expense.receipts, {
    onDelete: 'CASCADE',
  })
  expense!: Expense;

  @Column()
  fileUrl!: string;

  @Column({ nullable: true })
  thumbnailUrl?: string;

  @Column()
  mimeType!: string;

  @Column({ type: 'int', nullable: true })
  fileSize?: number;

  @Column({ type: 'timestamp', default: () => 'now()' })
  uploadedAt!: Date;

  @Column({ type: 'jsonb', nullable: true })
  rawOcrJson?: Record<string, unknown>;

  @Column({ type: 'numeric', precision: 4, scale: 3, nullable: true })
  confidenceScore?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
