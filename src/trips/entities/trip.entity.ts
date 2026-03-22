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
