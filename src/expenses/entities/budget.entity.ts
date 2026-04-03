import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';

@Entity('budgets')
@Unique(['tripId'])
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  tripId!: string;

  @ManyToOne(() => Trip, (trip) => trip.budgets, { onDelete: 'CASCADE' })
  trip!: Trip;

  @Column({ length: 3 })
  baseCurrency!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  totalAmount!: number;

  @Column({ type: 'jsonb', nullable: true })
  categoryLimits?: Record<string, number>;

  @Column({ type: 'int', default: 80 })
  warningThreshold!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
