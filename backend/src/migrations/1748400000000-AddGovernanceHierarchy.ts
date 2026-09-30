import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGovernanceHierarchy1748400000000 implements MigrationInterface {
  name = 'AddGovernanceHierarchy1748400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "governance_scope" jsonb`);
    await queryRunner.query(`ALTER TABLE "tenant_services" ADD COLUMN IF NOT EXISTS "service_scope" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tenant_services" DROP COLUMN IF EXISTS "service_scope"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN IF EXISTS "governance_scope"`);
  }
}