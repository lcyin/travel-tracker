import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddItineraryTables1774400000000 implements MigrationInterface {
  name = 'AddItineraryTables1774400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "itinerary_days" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tripId" uuid NOT NULL,
        "date" date NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_itinerary_days_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_itinerary_days_trip_date" UNIQUE ("tripId", "date"),
        CONSTRAINT "FK_itinerary_days_trip" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "itinerary_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "dayId" uuid NOT NULL,
        "type" character varying NOT NULL,
        "title" character varying NOT NULL,
        "notes" text,
        "startTime" time,
        "endTime" time,
        "orderIndex" integer,
        "status" character varying NOT NULL DEFAULT 'planned',
        "deletedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_itinerary_items_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_itinerary_items_day" FOREIGN KEY ("dayId") REFERENCES "itinerary_days"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "itinerary_items"');
    await queryRunner.query('DROP TABLE "itinerary_days"');
  }
}
