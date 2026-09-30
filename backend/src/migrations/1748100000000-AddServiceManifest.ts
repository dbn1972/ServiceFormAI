import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServiceManifest1748100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tenant_services
      ADD COLUMN IF NOT EXISTS manifest JSONB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tenant_services
      DROP COLUMN IF EXISTS manifest
    `);
  }
}