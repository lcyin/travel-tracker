import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTripStatusAndType1742630000000 implements MigrationInterface {
  name = 'AddTripStatusAndType1742630000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "trips" ADD "tripType" character varying NOT NULL DEFAULT \'leisure\'',
    );
    await queryRunner.query(
      'ALTER TABLE "trips" ADD "status" character varying NOT NULL DEFAULT \'planning\'',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "trips" DROP COLUMN "status"');
    await queryRunner.query('ALTER TABLE "trips" DROP COLUMN "tripType"');
  }
}
