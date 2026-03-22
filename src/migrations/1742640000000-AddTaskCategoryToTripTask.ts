import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskCategoryToTripTask1742640000000 implements MigrationInterface {
  name = 'AddTaskCategoryToTripTask1742640000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "trip_tasks" ADD "category" character varying',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "trip_tasks" DROP COLUMN "category"');
  }
}
