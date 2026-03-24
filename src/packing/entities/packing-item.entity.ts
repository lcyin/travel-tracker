import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';

@Entity('packing_items')
export class PackingItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ default: false })
  isPacked!: boolean;

  @Column({ default: 1 })
  quantity!: number;

  @Column({ nullable: true })
  category?: string;

  @Column()
  tripId!: string;

  @ManyToOne(() => Trip, (trip) => trip.packingItems, { onDelete: 'CASCADE' })
  trip!: Trip;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt?: Date;
}
