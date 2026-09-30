import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantOnboardingIdentity1790640000000 implements MigrationInterface {
  name = 'AddTenantOnboardingIdentity1790640000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tenants"
      ADD COLUMN "subdomain" varchar(63),
      ADD COLUMN "onboarding_metadata" jsonb
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_tenants_subdomain"
      ON "tenants" ("subdomain") WHERE "subdomain" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_tenants_onboarding_governance_identity"
      ON "tenants" (
        lower("name"),
        COALESCE("governance_scope"->>'state_name', ''),
        COALESCE("governance_scope"->>'district_name', ''),
        COALESCE("governance_scope"->>'municipality_name', '')
      )
      WHERE "subdomain" IS NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "uq_tenants_onboarding_governance_identity"');
    await queryRunner.query('DROP INDEX "uq_tenants_subdomain"');
    await queryRunner.query(`
      ALTER TABLE "tenants"
      DROP COLUMN "subdomain",
      DROP COLUMN "onboarding_metadata"
    `);
  }
}