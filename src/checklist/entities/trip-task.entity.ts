import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';

@Entity('trip_tasks')
export class TripTask {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ default: false })
  isCompleted!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date;

  @Column({ default: 0 })
  priority!: number;

  @Column()
  tripId!: string;

  @ManyToOne(() => Trip, (trip) => trip.tasks, { onDelete: 'CASCADE' })
  trip!: Trip;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
