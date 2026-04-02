import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';
import { ItineraryItem } from './itinerary-item.entity';

@Entity('itinerary_days')
@Unique(['tripId', 'date'])
export class ItineraryDay {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  tripId!: string;

  @ManyToOne(() => Trip, (trip) => trip.days, { onDelete: 'CASCADE' })
  trip!: Trip;

  @Column({ type: 'date' })
  date!: string;

  @OneToMany(() => ItineraryItem, (item) => item.day)
  items!: ItineraryItem[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
