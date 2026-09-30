import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSchemaVersioning1748000000000 implements MigrationInterface {
  name = 'AddSchemaVersioning1748000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add schema versioning columns to tenant_services
    await queryRunner.query(`
      ALTER TABLE "tenant_services"
        ADD COLUMN IF NOT EXISTS "schema_version" INTEGER NOT NULL DEFAULT 1
    `);

    await queryRunner.query(`
      ALTER TABLE "tenant_services"
        ADD COLUMN IF NOT EXISTS "schema_version_history" JSONB DEFAULT '[]'
    `);

    // Add offline submission columns to applications
    await queryRunner.query(`
      ALTER TABLE "applications"
        ADD COLUMN IF NOT EXISTS "schema_version" INTEGER
    `);

    await queryRunner.query(`
      ALTER TABLE "applications"
        ADD COLUMN IF NOT EXISTS "offline_submitted_at" TIMESTAMPTZ
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "applications"
        DROP COLUMN IF EXISTS "offline_submitted_at"
    `);

    await queryRunner.query(`
      ALTER TABLE "applications"
        DROP COLUMN IF EXISTS "schema_version"
    `);

    await queryRunner.query(`
      ALTER TABLE "tenant_services"
        DROP COLUMN IF EXISTS "schema_version_history"
    `);

    await queryRunner.query(`
      ALTER TABLE "tenant_services"
        DROP COLUMN IF EXISTS "schema_version"
    `);
  }
}
