import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImmutableServiceReleases1790726400000 implements MigrationInterface {
  name = 'AddImmutableServiceReleases1790726400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tenant_service_releases" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "service_id" uuid NOT NULL,
        "version" integer NOT NULL,
        "snapshot" jsonb NOT NULL,
        "content_hash" varchar(64) NOT NULL,
        "published_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tenant_service_releases" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tenant_service_releases_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_tenant_service_releases_service" FOREIGN KEY ("service_id") REFERENCES "tenant_services"("id") ON DELETE RESTRICT,
        CONSTRAINT "uq_tenant_service_release_version" UNIQUE ("service_id", "version")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_tenant_service_releases_tenant"
      ON "tenant_service_releases" ("tenant_id", "service_id")
    `);
    await queryRunner.query(`
      ALTER TABLE "tenant_services"
      ADD COLUMN "current_release_id" uuid,
      ADD COLUMN "archived" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE "tenant_services"
      ADD CONSTRAINT "FK_tenant_services_current_release"
      FOREIGN KEY ("current_release_id") REFERENCES "tenant_service_releases"("id") ON DELETE RESTRICT
    `);
    await queryRunner.query(`
      INSERT INTO "tenant_service_releases" (
        "tenant_id", "service_id", "version", "snapshot", "content_hash"
      )
      SELECT
        ts."tenant_id",
        ts."id",
        1,
        jsonb_build_object(
          'id', ts."id",
          'tenant_id', ts."tenant_id",
          'name', ts."name",
          'category', ts."category",
          'description', ts."description",
          'service_scope', ts."service_scope",
          'form_schema', ts."form_schema",
          'workflow_config', ts."workflow_config",
          'eligibility_rules', ts."eligibility_rules",
          'required_documents', ts."required_documents",
          'backend_api_config', ts."backend_api_config",
          'manifest', ts."manifest",
          'sla_days', ts."sla_days",
          'fees', ts."fees",
          'schema_version', ts."schema_version"
        ),
        encode(digest(jsonb_build_object(
          'id', ts."id",
          'tenant_id', ts."tenant_id",
          'name', ts."name",
          'category', ts."category",
          'description', ts."description",
          'service_scope', ts."service_scope",
          'form_schema', ts."form_schema",
          'workflow_config', ts."workflow_config",
          'eligibility_rules', ts."eligibility_rules",
          'required_documents', ts."required_documents",
          'backend_api_config', ts."backend_api_config",
          'manifest', ts."manifest",
          'sla_days', ts."sla_days",
          'fees', ts."fees",
          'schema_version', ts."schema_version"
        )::text, 'sha256'), 'hex')
      FROM "tenant_services" ts
    `);
    await queryRunner.query(`
      UPDATE "tenant_services" ts
      SET "current_release_id" = r."id"
      FROM "tenant_service_releases" r
      WHERE r."service_id" = ts."id" AND r."version" = 1 AND ts."published" = true
    `);
    await queryRunner.query(`
      ALTER TABLE "applications"
      ADD COLUMN "service_release_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "applications"
      ADD CONSTRAINT "FK_applications_service_release"
      FOREIGN KEY ("service_release_id") REFERENCES "tenant_service_releases"("id") ON DELETE RESTRICT
    `);
    await queryRunner.query(`
      UPDATE "applications" a
      SET "service_release_id" = r."id"
      FROM "tenant_services" ts
      JOIN "tenant_service_releases" r ON r."service_id" = ts."id" AND r."version" = 1
      WHERE a."service_id" = ts."id"
    `);
    await queryRunner.query(`
      CREATE FUNCTION reject_service_release_mutation() RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'Tenant service releases are immutable';
      END;
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`
      CREATE TRIGGER "trg_tenant_service_releases_immutable"
      BEFORE UPDATE OR DELETE ON "tenant_service_releases"
      FOR EACH ROW EXECUTE FUNCTION reject_service_release_mutation()
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TRIGGER "trg_tenant_service_releases_immutable" ON "tenant_service_releases"');
    await queryRunner.query('DROP FUNCTION reject_service_release_mutation()');
    await queryRunner.query('ALTER TABLE "applications" DROP CONSTRAINT "FK_applications_service_release"');
    await queryRunner.query('ALTER TABLE "applications" DROP COLUMN "service_release_id"');
    await queryRunner.query('ALTER TABLE "tenant_services" DROP CONSTRAINT "FK_tenant_services_current_release"');
    await queryRunner.query('ALTER TABLE "tenant_services" DROP COLUMN "archived", DROP COLUMN "current_release_id"');
    await queryRunner.query('DROP TABLE "tenant_service_releases"');
  }
}