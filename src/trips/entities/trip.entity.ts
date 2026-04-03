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
import { ItineraryDay } from '../../itinerary/entities/itinerary-day.entity';
import { PackingItem } from '../../packing/entities/packing-item.entity';
import { Expense } from '../../expenses/entities/expense.entity';
import { Budget } from '../../expenses/entities/budget.entity';
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

  @Column({ length: 3, nullable: true })
  baseCurrency?: string;

  @Column()
  userId!: string;

  @ManyToOne(() => User, (user) => user.trips, { onDelete: 'CASCADE' })
  user!: User;

  @OneToMany(() => TripTask, (task) => task.trip)
  tasks!: TripTask[];

  @OneToMany(() => PackingItem, (item) => item.trip)
  packingItems!: PackingItem[];

  @OneToMany(() => ItineraryDay, (day) => day.trip)
  days!: ItineraryDay[];

  @OneToMany(() => Expense, (expense) => expense.trip)
  expenses!: Expense[];

  @OneToMany(() => Budget, (budget) => budget.trip)
  budgets!: Budget[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
