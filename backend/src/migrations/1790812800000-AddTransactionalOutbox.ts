import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTransactionalOutbox1790812800000 implements MigrationInterface {
  name = 'AddTransactionalOutbox1790812800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "outbox_events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "event_type" varchar(120) NOT NULL,
        "aggregate_type" varchar(120) NOT NULL,
        "aggregate_id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "payload" jsonb NOT NULL,
        "idempotency_key" varchar(255) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_outbox_events" PRIMARY KEY ("id"),
        CONSTRAINT "uq_outbox_events_idempotency" UNIQUE ("idempotency_key"),
        CONSTRAINT "FK_outbox_events_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_outbox_events_status_created"
      ON "outbox_events" ("status", "created_at")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "outbox_events"');
  }
}