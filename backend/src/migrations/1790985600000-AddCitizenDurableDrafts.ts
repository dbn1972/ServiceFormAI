import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCitizenDurableDrafts1790985600000 implements MigrationInterface {
  name = 'AddCitizenDurableDrafts1790985600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_applications_active_citizen_draft"
      ON "applications" ("consumer_id", "service_id", "service_release_id")
      WHERE "status" = 'DRAFT' AND "service_release_id" IS NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "uq_applications_active_citizen_draft"');
  }
}