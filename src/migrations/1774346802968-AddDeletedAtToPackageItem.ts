import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeletedAtToPackageItem1774346802968 implements MigrationInterface {
  name = 'AddDeletedAtToPackageItem1774346802968';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "packing_items" ADD "deletedAt" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "packing_items" DROP COLUMN "deletedAt"`,
    );
  }
}
