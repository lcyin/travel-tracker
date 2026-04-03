import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateExpensesModule1774346900000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create expenses table
    await queryRunner.createTable(
      new Table({
        name: 'expenses',
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
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'occurredAt',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'merchantName',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'amount',
            type: 'numeric',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            isNullable: false,
          },
          {
            name: 'baseAmount',
            type: 'numeric',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'baseCurrency',
            type: 'varchar',
            length: '3',
            isNullable: true,
          },
          {
            name: 'exchangeRate',
            type: 'numeric',
            precision: 10,
            scale: 6,
            isNullable: true,
          },
          {
            name: 'exchangeRateSource',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'exchangeRateAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            default: "'Other'",
            isNullable: false,
          },
          {
            name: 'paymentMethod',
            type: 'varchar',
            default: "'Cash'",
            isNullable: false,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'source',
            type: 'varchar',
            default: "'Manual'",
            isNullable: false,
          },
          {
            name: 'extractionStatus',
            type: 'varchar',
            default: "'None'",
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create foreign key for expenses -> trips
    await queryRunner.createForeignKey(
      'expenses',
      new TableForeignKey({
        columnNames: ['tripId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'trips',
        onDelete: 'CASCADE',
      }),
    );

    // Create index on tripId and deletedAt for faster queries
    await queryRunner.createIndex(
      'expenses',
      new TableIndex({
        name: 'IDX_expenses_tripId',
        columnNames: ['tripId'],
      }),
    );

    await queryRunner.createIndex(
      'expenses',
      new TableIndex({
        name: 'IDX_expenses_tripId_deletedAt',
        columnNames: ['tripId', 'deletedAt'],
      }),
    );

    // Create receipts table
    await queryRunner.createTable(
      new Table({
        name: 'receipts',
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
            name: 'fileUrl',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'thumbnailUrl',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'mimeType',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'fileSize',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'uploadedAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'rawOcrJson',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'confidenceScore',
            type: 'numeric',
            precision: 4,
            scale: 3,
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create foreign key for receipts -> expenses
    await queryRunner.createForeignKey(
      'receipts',
      new TableForeignKey({
        columnNames: ['expenseId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'expenses',
        onDelete: 'CASCADE',
      }),
    );

    // Create index on expenseId
    await queryRunner.createIndex(
      'receipts',
      new TableIndex({
        name: 'IDX_receipts_expenseId',
        columnNames: ['expenseId'],
      }),
    );

    // Create budgets table
    await queryRunner.createTable(
      new Table({
        name: 'budgets',
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
            isUnique: true,
          },
          {
            name: 'baseCurrency',
            type: 'varchar',
            length: '3',
            isNullable: false,
          },
          {
            name: 'totalAmount',
            type: 'numeric',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'categoryLimits',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'warningThreshold',
            type: 'int',
            default: '80',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create foreign key for budgets -> trips
    await queryRunner.createForeignKey(
      'budgets',
      new TableForeignKey({
        columnNames: ['tripId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'trips',
        onDelete: 'CASCADE',
      }),
    );

    // Create index on tripId
    await queryRunner.createIndex(
      'budgets',
      new TableIndex({
        name: 'IDX_budgets_tripId',
        columnNames: ['tripId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop budgets table
    await queryRunner.dropTable('budgets', true);

    // Drop receipts table
    await queryRunner.dropTable('receipts', true);

    // Drop expenses table
    await queryRunner.dropTable('expenses', true);
  }
}
