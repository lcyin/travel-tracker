import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Expense } from './expense.entity';
import { TripParticipant } from './trip-participant.entity';

@Entity('expense_included_participants')
export class ExpenseIncludedParticipant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  expenseId!: string;

  @Column()
  participantId!: string;

  @ManyToOne(() => Expense, (expense) => expense.includedParticipants, {
    onDelete: 'CASCADE',
  })
  expense!: Expense;

  @ManyToOne(
    () => TripParticipant,
    (participant) => participant.includedInExpenses,
    { onDelete: 'CASCADE', eager: true },
  )
  participant!: TripParticipant;
}
