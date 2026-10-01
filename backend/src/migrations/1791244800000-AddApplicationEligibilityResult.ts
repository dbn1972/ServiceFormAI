import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApplicationEligibilityResult1791244800000 implements MigrationInterface {
  name = 'AddApplicationEligibilityResult1791244800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "applications" ADD COLUMN "eligibility_result" jsonb');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "applications" DROP COLUMN "eligibility_result"');
  }
}