import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeletedAtToTripTask1742670000000 implements MigrationInterface {
  name = 'AddDeletedAtToTripTask1742670000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "trip_tasks" ADD "deletedAt" TIMESTAMP',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "trip_tasks" DROP COLUMN "deletedAt"');
  }
}
