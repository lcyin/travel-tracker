import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';
import { ExpenseIncludedParticipant } from './expense-included-participant.entity';

@Entity('trip_participants')
export class TripParticipant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  tripId!: string;

  @ManyToOne(() => Trip, (trip) => trip.participants, { onDelete: 'CASCADE' })
  trip!: Trip;

  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'date' })
  stayStart!: string;

  @Column({ type: 'date' })
  stayEnd!: string;

  @OneToMany(() => ExpenseIncludedParticipant, (eip) => eip.participant)
  includedInExpenses?: ExpenseIncludedParticipant[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
