import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * AddCustomComponentConfigs
 *
 * Creates the custom_component_configs table for the Custom Component Registry.
 * Stores tenant-scoped custom component configurations with full tenant isolation.
 */
export class AddCustomComponentConfigs1746500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS custom_component_configs (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id       UUID         NOT NULL REFERENCES tenants(id),
        field_type      VARCHAR(50)  NOT NULL,
        display_name    VARCHAR(255) NOT NULL,
        version         VARCHAR(20)  NOT NULL,
        description     TEXT,
        bundle_url      VARCHAR(500),
        validators      JSONB,
        default_config  JSONB,
        allowed_domains JSONB,
        active          BOOLEAN      NOT NULL DEFAULT TRUE,
        created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

        CONSTRAINT uq_tenant_field_type UNIQUE (tenant_id, field_type)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_custom_component_tenant
        ON custom_component_configs (tenant_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_custom_component_tenant_fieldtype
        ON custom_component_configs (tenant_id, field_type)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS custom_component_configs CASCADE`,
    );
  }
}
