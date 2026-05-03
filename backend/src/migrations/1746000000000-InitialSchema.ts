import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1746000000000 implements MigrationInterface {
  name = 'InitialSchema1746000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── tenants ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tenants" (
        "id"                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name"                 VARCHAR(255) NOT NULL,
        "type"                 VARCHAR(50) NOT NULL,
        "status"               VARCHAR(50) NOT NULL DEFAULT 'active',
        "api_base_url"         VARCHAR(255),
        "contact_email"        VARCHAR(255),
        "branding"             JSONB,
        "auth_policy"          JSONB,
        "consent_policy"       JSONB,
        "notification_policy"  JSONB,
        "integration_policy"   JSONB,
        "created_at"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"           TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // ── tenant_users ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tenant_users" (
        "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"     UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "email"         VARCHAR(255) NOT NULL,
        "password_hash" VARCHAR(255) NOT NULL,
        "role"          VARCHAR(50) NOT NULL,
        "first_name"    VARCHAR(100),
        "last_name"     VARCHAR(100),
        "active"        BOOLEAN NOT NULL DEFAULT TRUE,
        "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_tenant_users_tenant_email"
        ON "tenant_users" ("tenant_id", "email");
    `);

    // ── consumer_users ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "consumer_users" (
        "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name"            VARCHAR(255),
        "consumer_source" VARCHAR(50) NOT NULL,
        "external_id"     VARCHAR(255) NOT NULL,
        "email"           VARCHAR(255),
        "phone"           VARCHAR(20),
        "password_hash"   VARCHAR(255),
        "active"          BOOLEAN NOT NULL DEFAULT TRUE,
        "digilocker_data" JSONB,
        "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_consumer_users_source_external"
        ON "consumer_users" ("consumer_source", "external_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_consumer_users_email" ON "consumer_users" ("email");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_consumer_users_phone" ON "consumer_users" ("phone");
    `);

    // ── tenant_services ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tenant_services" (
        "id"                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"          UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "name"               VARCHAR(255) NOT NULL,
        "category"           VARCHAR(100) NOT NULL,
        "description"        TEXT,
        "form_schema"        JSONB NOT NULL,
        "workflow_config"    JSONB NOT NULL,
        "eligibility_rules"  JSONB,
        "required_documents" JSONB,
        "backend_api_config" JSONB,
        "published"          BOOLEAN NOT NULL DEFAULT FALSE,
        "sla_days"           INTEGER,
        "fees"               DECIMAL(10,2),
        "created_at"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_tenant_services_tenant"
        ON "tenant_services" ("tenant_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_tenant_services_published_category"
        ON "tenant_services" ("published", "category");
    `);

    // ── applications ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "applications" (
        "id"                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"            UUID NOT NULL,
        "service_id"           UUID NOT NULL,
        "consumer_id"          UUID NOT NULL,
        "consumer_source"      VARCHAR(50) NOT NULL,
        "form_data"            JSONB NOT NULL,
        "status"               VARCHAR(50) NOT NULL,
        "current_stage"        VARCHAR(100),
        "tracking_number"      VARCHAR(50) NOT NULL UNIQUE,
        "backend_reference_id" VARCHAR(255),
        "assigned_to"          UUID,
        "idempotency_key"      VARCHAR(255) UNIQUE,
        "created_at"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"           TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_applications_tenant_status"
        ON "applications" ("tenant_id", "status");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_applications_consumer_status"
        ON "applications" ("consumer_id", "status");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_applications_service"
        ON "applications" ("service_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_applications_idempotency"
        ON "applications" ("idempotency_key")
        WHERE "idempotency_key" IS NOT NULL;
    `);

    // ── queue_messages ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "queue_messages" (
        "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "provider"         VARCHAR(50) NOT NULL,
        "type"             VARCHAR(120) NOT NULL,
        "module"           VARCHAR(160) NOT NULL,
        "payload"          JSONB NOT NULL,
        "idempotency_key"  VARCHAR(255) NOT NULL UNIQUE,
        "status"           VARCHAR(20) NOT NULL DEFAULT 'queued',
        "attempts"         INTEGER NOT NULL DEFAULT 0,
        "last_error"       TEXT,
        "claimed_at"       TIMESTAMPTZ,
        "processed_at"     TIMESTAMPTZ,
        "available_at"     TIMESTAMPTZ NOT NULL,
        "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_queue_messages_status_available"
        ON "queue_messages" ("status", "available_at");
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_queue_messages_idempotency"
        ON "queue_messages" ("idempotency_key");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_queue_messages_type_status"
        ON "queue_messages" ("type", "status");
    `);

    // ── audit_logs ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "event_type"    VARCHAR(60) NOT NULL,
        "actor_id"      UUID,
        "actor_role"    VARCHAR(50),
        "tenant_id"     UUID,
        "ip_address"    VARCHAR(45),
        "resource_type" VARCHAR(60),
        "resource_id"   VARCHAR(255),
        "metadata"      JSONB,
        "success"       BOOLEAN NOT NULL DEFAULT TRUE,
        "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_audit_logs_actor"
        ON "audit_logs" ("actor_id", "created_at");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_audit_logs_tenant"
        ON "audit_logs" ("tenant_id", "created_at");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_audit_logs_event_type"
        ON "audit_logs" ("event_type", "created_at");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_audit_logs_resource"
        ON "audit_logs" ("resource_type", "resource_id");
    `);

    // ── login_rate_limits ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "login_rate_limits" (
        "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "identifier_hash"  VARCHAR(64) NOT NULL,
        "ip_address"       VARCHAR(45) NOT NULL,
        "failure_count"    INTEGER NOT NULL DEFAULT 1,
        "window_started_at" TIMESTAMPTZ NOT NULL,
        "locked_until"     TIMESTAMPTZ,
        "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_login_rate_limits_identifier_ip"
        ON "login_rate_limits" ("identifier_hash", "ip_address");
    `);

    // ── refresh_token_nonces ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "refresh_token_nonces" (
        "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"    UUID NOT NULL,
        "user_type"  VARCHAR(10) NOT NULL,
        "nonce"      VARCHAR(36) NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "revoked_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_refresh_nonces_nonce"
        ON "refresh_token_nonces" ("nonce");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_refresh_nonces_user"
        ON "refresh_token_nonces" ("user_id", "revoked_at");
    `);

    // ── consent_records ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "consent_records" (
        "id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "consumer_id"         UUID NOT NULL,
        "tenant_id"           UUID NOT NULL,
        "purpose"             VARCHAR(100) NOT NULL,
        "purpose_description" TEXT NOT NULL,
        "resource_type"       VARCHAR(60),
        "resource_id"         VARCHAR(255),
        "status"              VARCHAR(20) NOT NULL DEFAULT 'pending',
        "request_id"          VARCHAR(255),
        "granted_at"          TIMESTAMPTZ,
        "denied_at"           TIMESTAMPTZ,
        "revoked_at"          TIMESTAMPTZ,
        "expires_at"          TIMESTAMPTZ,
        "metadata"            JSONB,
        "created_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_consent_records_consumer"
        ON "consent_records" ("consumer_id", "status");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_consent_records_tenant"
        ON "consent_records" ("tenant_id", "status");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_consent_records_lookup"
        ON "consent_records" ("consumer_id", "tenant_id", "purpose", "status");
    `);

    // ── integration_providers ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "integration_providers" (
        "id"                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"             UUID NOT NULL,
        "provider"              VARCHAR(60) NOT NULL,
        "status"                VARCHAR(20) NOT NULL DEFAULT 'disabled',
        "config"                JSONB,
        "credential_refs"       JSONB,
        "webhook_secret_ref"    VARCHAR(255),
        "last_health_check_at"  TIMESTAMPTZ,
        "last_health_check_ok"  BOOLEAN,
        "last_error"            TEXT,
        "consecutive_failures"  INTEGER NOT NULL DEFAULT 0,
        "circuit_open_until"    TIMESTAMPTZ,
        "created_at"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"            TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_integration_providers_tenant_provider"
        ON "integration_providers" ("tenant_id", "provider");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_integration_providers_tenant_status"
        ON "integration_providers" ("tenant_id", "status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "integration_providers" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "consent_records" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_token_nonces" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "login_rate_limits" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "queue_messages" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "applications" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tenant_services" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "consumer_users" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tenant_users" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tenants" CASCADE;`);
  }
}
