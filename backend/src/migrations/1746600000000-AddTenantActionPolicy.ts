import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * AddTenantActionPolicy
 *
 * Adds the `action_policy` JSONB column to the `tenants` table.
 * Stores per-tenant action configuration: fetch domain allowlist and
 * a kill switch to enable/disable custom form actions.
 */
export class AddTenantActionPolicy1746600000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tenants
        ADD COLUMN IF NOT EXISTS action_policy JSONB DEFAULT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tenants
        DROP COLUMN IF EXISTS action_policy
    `);
  }
}
