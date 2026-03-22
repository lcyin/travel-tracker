import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { TripTask } from '../../checklist/entities/trip-task.entity';
import { PackingItem } from '../../packing/entities/packing-item.entity';
import { TripStatus, TripClimate, TripType } from '../enums/trip.enums';

@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ nullable: true })
  destination?: string;

  @Column({ type: 'date', nullable: true })
  startDate?: string;

  @Column({ type: 'date', nullable: true })
  endDate?: string;

  @Column({
    type: 'varchar',
    default: TripType.Leisure,
  })
  tripType!: TripType;

  @Column({
    type: 'varchar',
    default: TripStatus.Planning,
  })
  status!: TripStatus;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  climate?: TripClimate;

  @Column()
  userId!: string;

  @ManyToOne(() => User, (user) => user.trips, { onDelete: 'CASCADE' })
  user!: User;

  @OneToMany(() => TripTask, (task) => task.trip)
  tasks!: TripTask[];

  @OneToMany(() => PackingItem, (item) => item.trip)
  packingItems!: PackingItem[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
