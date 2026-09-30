import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServicePublicationApprovals1790899200000 implements MigrationInterface {
  name = 'AddServicePublicationApprovals1790899200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "service_publication_approvals" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "service_id" uuid NOT NULL,
        "requested_by_id" uuid NOT NULL,
        "approved_by_id" uuid,
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        "requested_content_hash" varchar(64) NOT NULL,
        "decision_notes" text,
        "resolved_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_service_publication_approvals" PRIMARY KEY ("id"),
        CONSTRAINT "FK_service_publication_approvals_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_service_publication_approvals_service" FOREIGN KEY ("service_id") REFERENCES "tenant_services"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_service_publication_approvals_requester" FOREIGN KEY ("requested_by_id") REFERENCES "tenant_users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_service_publication_approvals_approver" FOREIGN KEY ("approved_by_id") REFERENCES "tenant_users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_service_publication_pending"
      ON "service_publication_approvals" ("service_id") WHERE "status" = 'pending'
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_service_publication_approvals_tenant_status"
      ON "service_publication_approvals" ("tenant_id", "status", "created_at")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "service_publication_approvals"');
  }
}