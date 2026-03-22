import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1742600000000 implements MigrationInterface {
  name = 'InitSchema1742600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "passwordHash" character varying NOT NULL,
        "displayName" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "trips" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "destination" character varying,
        "startDate" date,
        "endDate" date,
        "userId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_trips_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_trips_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "trip_tasks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "isCompleted" boolean NOT NULL DEFAULT false,
        "dueDate" TIMESTAMP,
        "priority" integer NOT NULL DEFAULT 0,
        "tripId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_trip_tasks_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_trip_tasks_trip" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "packing_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "isPacked" boolean NOT NULL DEFAULT false,
        "quantity" integer NOT NULL DEFAULT 1,
        "category" character varying,
        "tripId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_packing_items_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_packing_items_trip" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "packing_items"');
    await queryRunner.query('DROP TABLE "trip_tasks"');
    await queryRunner.query('DROP TABLE "trips"');
    await queryRunner.query('DROP TABLE "users"');
  }
}
