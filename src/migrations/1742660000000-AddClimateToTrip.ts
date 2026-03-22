import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClimateToTrip1742660000000 implements MigrationInterface {
  name = 'AddClimateToTrip1742660000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "trips" ADD "climate" character varying',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "trips" DROP COLUMN "climate"');
  }
}
