import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * AddActionCodeVersions
 *
 * Creates the `action_code_versions` table for tracking versioned
 * snapshots of action code changes.
 */
export class AddActionCodeVersions1746700000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS action_code_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        service_id UUID NOT NULL,
        action_id VARCHAR(255) NOT NULL,
        version INT NOT NULL,
        code TEXT NOT NULL,
        event VARCHAR(50) NOT NULL,
        target_id VARCHAR(255),
        changed_by UUID,
        change_description VARCHAR(500),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT uq_action_version UNIQUE (tenant_id, service_id, action_id, version)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_action_code_versions_lookup
        ON action_code_versions (tenant_id, service_id, action_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS action_code_versions`);
  }
}
