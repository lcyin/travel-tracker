import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class AddCostSplitterTables1780400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create trip_participants table
    await queryRunner.createTable(
      new Table({
        name: 'trip_participants',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tripId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'stayStart',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'stayEnd',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'trip_participants',
      new TableForeignKey({
        columnNames: ['tripId'],
        referencedTableName: 'trips',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_trip_participants_tripId',
      }),
    );

    await queryRunner.createIndex(
      'trip_participants',
      new TableIndex({
        name: 'IDX_trip_participants_tripId',
        columnNames: ['tripId'],
      }),
    );

    // 2. Add split columns to expenses
    await queryRunner.addColumns('expenses', [
      new TableColumn({
        name: 'paidByParticipantId',
        type: 'uuid',
        isNullable: true,
      }),
      new TableColumn({
        name: 'splitMode',
        type: 'varchar',
        length: '20',
        isNullable: true,
      }),
      new TableColumn({
        name: 'expenseEndDate',
        type: 'date',
        isNullable: true,
      }),
    ]);

    await queryRunner.createForeignKey(
      'expenses',
      new TableForeignKey({
        columnNames: ['paidByParticipantId'],
        referencedTableName: 'trip_participants',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'FK_expenses_paidByParticipantId',
      }),
    );

    // 3. Create expense_included_participants junction table
    await queryRunner.createTable(
      new Table({
        name: 'expense_included_participants',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'expenseId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'participantId',
            type: 'uuid',
            isNullable: false,
          },
        ],
        uniques: [
          {
            name: 'UQ_eip_expenseId_participantId',
            columnNames: ['expenseId', 'participantId'],
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'expense_included_participants',
      new TableForeignKey({
        columnNames: ['expenseId'],
        referencedTableName: 'expenses',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_eip_expenseId',
      }),
    );

    await queryRunner.createForeignKey(
      'expense_included_participants',
      new TableForeignKey({
        columnNames: ['participantId'],
        referencedTableName: 'trip_participants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_eip_participantId',
      }),
    );

    await queryRunner.createIndex(
      'expense_included_participants',
      new TableIndex({
        name: 'IDX_eip_expenseId',
        columnNames: ['expenseId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('expense_included_participants', true);

    await queryRunner.dropForeignKey(
      'expenses',
      'FK_expenses_paidByParticipantId',
    );
    await queryRunner.dropColumns('expenses', [
      'paidByParticipantId',
      'splitMode',
      'expenseEndDate',
    ]);

    await queryRunner.dropTable('trip_participants', true);
  }
}
