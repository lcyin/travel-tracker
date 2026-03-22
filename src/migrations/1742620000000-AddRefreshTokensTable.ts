import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshTokensTable1742620000000 implements MigrationInterface {
  name = 'AddRefreshTokensTable1742620000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "jti" character varying NOT NULL,
        "userId" uuid NOT NULL,
        "tokenHash" character varying NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "revokedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_refresh_tokens_jti" UNIQUE ("jti"),
        CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      'CREATE INDEX "IDX_refresh_tokens_userId" ON "refresh_tokens" ("userId")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_refresh_tokens_userId_revokedAt" ON "refresh_tokens" ("userId", "revokedAt")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_refresh_tokens_userId_revokedAt"');
    await queryRunner.query('DROP INDEX "IDX_refresh_tokens_userId"');
    await queryRunner.query('DROP TABLE "refresh_tokens"');
  }
}
