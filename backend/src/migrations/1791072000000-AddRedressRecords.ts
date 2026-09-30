import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRedressRecords1791072000000 implements MigrationInterface {
  name = 'AddRedressRecords1791072000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "grievance_cases" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(), "tenant_id" uuid NOT NULL,
        "application_id" uuid NOT NULL, "service_release_id" uuid NOT NULL, "consumer_id" uuid NOT NULL,
        "category" varchar(120) NOT NULL, "subject" varchar(255) NOT NULL,
        "description" text NOT NULL, "status" varchar(30) NOT NULL DEFAULT 'submitted',
        "assigned_to" uuid, "resolution" text, "resolved_at" timestamptz,
        "reopened_at" timestamptz, "due_at" timestamptz, "timeline" jsonb NOT NULL DEFAULT '[]',
        "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_grievance_cases" PRIMARY KEY ("id"),
        CONSTRAINT "FK_grievance_cases_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_grievance_cases_application" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_grievance_cases_release" FOREIGN KEY ("service_release_id") REFERENCES "tenant_service_releases"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_grievance_cases_consumer" FOREIGN KEY ("consumer_id") REFERENCES "consumer_users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_grievance_cases_tenant_status" ON "grievance_cases" ("tenant_id", "status", "created_at")`);
    await queryRunner.query(`CREATE INDEX "idx_grievance_cases_consumer" ON "grievance_cases" ("consumer_id", "created_at")`);
    await queryRunner.query(`
      CREATE TABLE "appeal_cases" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(), "tenant_id" uuid NOT NULL,
        "application_id" uuid NOT NULL, "service_release_id" uuid NOT NULL, "consumer_id" uuid NOT NULL,
        "original_decision_event_id" uuid NOT NULL, "original_decision_actor_id" uuid,
        "original_decision" varchar(50) NOT NULL,
        "grounds" varchar(120) NOT NULL, "statement" text NOT NULL,
        "status" varchar(30) NOT NULL DEFAULT 'submitted', "assigned_to" uuid,
        "decided_by" uuid, "decision_reason" text, "decided_at" timestamptz,
        "submitted_at" timestamptz NOT NULL, "appeal_deadline" timestamptz NOT NULL,
        "timeline" jsonb NOT NULL DEFAULT '[]', "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_appeal_cases" PRIMARY KEY ("id"),
        CONSTRAINT "uq_appeal_cases_application" UNIQUE ("application_id"),
        CONSTRAINT "FK_appeal_cases_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_appeal_cases_application" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_appeal_cases_release" FOREIGN KEY ("service_release_id") REFERENCES "tenant_service_releases"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_appeal_cases_consumer" FOREIGN KEY ("consumer_id") REFERENCES "consumer_users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_appeal_cases_decision_event" FOREIGN KEY ("original_decision_event_id") REFERENCES "application_events"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_appeal_cases_tenant_status" ON "appeal_cases" ("tenant_id", "status", "created_at")`);
    await queryRunner.query(`
      CREATE TABLE "citizen_feedback" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(), "tenant_id" uuid NOT NULL,
        "application_id" uuid NOT NULL, "service_release_id" uuid NOT NULL, "consumer_id" uuid NOT NULL, "rating" smallint NOT NULL,
        "comment" text, "tags" jsonb NOT NULL DEFAULT '[]', "status" varchar(30) NOT NULL DEFAULT 'submitted',
        "assigned_to" uuid, "response" text, "closed_at" timestamptz,
        "timeline" jsonb NOT NULL DEFAULT '[]',
        "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_citizen_feedback" PRIMARY KEY ("id"),
        CONSTRAINT "uq_citizen_feedback_application_consumer" UNIQUE ("application_id", "consumer_id"),
        CONSTRAINT "CHK_citizen_feedback_rating" CHECK ("rating" >= 1 AND "rating" <= 5),
        CONSTRAINT "FK_citizen_feedback_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_citizen_feedback_application" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_citizen_feedback_release" FOREIGN KEY ("service_release_id") REFERENCES "tenant_service_releases"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_citizen_feedback_consumer" FOREIGN KEY ("consumer_id") REFERENCES "consumer_users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_citizen_feedback_tenant_status" ON "citizen_feedback" ("tenant_id", "status", "created_at")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "citizen_feedback"');
    await queryRunner.query('DROP TABLE "appeal_cases"');
    await queryRunner.query('DROP TABLE "grievance_cases"');
  }
}