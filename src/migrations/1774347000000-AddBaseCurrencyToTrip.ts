import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBaseCurrencyToTrip1774347000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "baseCurrency" character varying(3)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "trips" DROP COLUMN IF EXISTS "baseCurrency"
    `);
  }
}
