import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskNotesToTripTask1742650000000 implements MigrationInterface {
  name = 'AddTaskNotesToTripTask1742650000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "trip_tasks" ADD "notes" text');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "trip_tasks" DROP COLUMN "notes"');
  }
}
