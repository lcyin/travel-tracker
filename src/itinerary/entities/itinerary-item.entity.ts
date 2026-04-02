import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  ItineraryItemStatus,
  ItineraryItemType,
} from '../enums/itinerary-item.enums';
import { ItineraryDay } from './itinerary-day.entity';

@Entity('itinerary_items')
export class ItineraryItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  dayId!: string;

  @ManyToOne(() => ItineraryDay, (day) => day.items, { onDelete: 'CASCADE' })
  day!: ItineraryDay;

  @Column({ type: 'varchar' })
  type!: ItineraryItemType;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'time', nullable: true })
  startTime?: string;

  @Column({ type: 'time', nullable: true })
  endTime?: string;

  @Column({ type: 'int', nullable: true })
  orderIndex?: number;

  @Column({ type: 'varchar', default: ItineraryItemStatus.Planned })
  status!: ItineraryItemStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt?: Date;
}
