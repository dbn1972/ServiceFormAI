import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApplicationOutputs1791158400000 implements MigrationInterface {
  name = 'AddApplicationOutputs1791158400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "application_outputs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "application_id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "consumer_id" uuid NOT NULL,
        "certificate_number" varchar(40) NOT NULL,
        "status" varchar(30) NOT NULL DEFAULT 'issued',
        "format" varchar(20) NOT NULL DEFAULT 'PDF',
        "storage_key" varchar(255),
        "verification_code" varchar(120) NOT NULL,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "issued_at" timestamptz NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_application_outputs" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_application_outputs_application" UNIQUE ("application_id"),
        CONSTRAINT "UQ_application_outputs_certificate" UNIQUE ("certificate_number"),
        CONSTRAINT "UQ_application_outputs_verification" UNIQUE ("verification_code"),
        CONSTRAINT "FK_application_outputs_application" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_application_outputs_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_application_outputs_consumer" FOREIGN KEY ("consumer_id") REFERENCES "consumer_users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_application_outputs_consumer" ON "application_outputs" ("consumer_id", "issued_at")`);
    await queryRunner.query(`CREATE INDEX "idx_application_outputs_tenant" ON "application_outputs" ("tenant_id", "issued_at")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "application_outputs"');
  }
}
