import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCitizenOtpChallenges1790467200000 implements MigrationInterface {
  name = 'AddCitizenOtpChallenges1790467200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "citizen_otp_challenges" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "mobile_e164" varchar(16) NOT NULL,
        "code_digest" varchar(64) NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "resend_available_at" timestamptz NOT NULL,
        "consumed_at" timestamptz,
        "failed_attempts" smallint NOT NULL DEFAULT 0,
        "max_attempts" smallint NOT NULL DEFAULT 5,
        "request_ip_hash" varchar(64) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_citizen_otp_challenges" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_citizen_otp_attempts" CHECK ("failed_attempts" >= 0 AND "failed_attempts" <= "max_attempts")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_citizen_otp_mobile_created"
      ON "citizen_otp_challenges" ("mobile_e164", "created_at")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "citizen_otp_challenges"');
  }
}