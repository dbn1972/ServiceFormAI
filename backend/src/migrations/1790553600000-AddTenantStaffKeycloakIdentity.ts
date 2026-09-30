import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantStaffKeycloakIdentity1790553600000 implements MigrationInterface {
  name = 'AddTenantStaffKeycloakIdentity1790553600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tenant_users"
      ADD COLUMN "keycloak_subject" varchar(255),
      ADD COLUMN "keycloak_issuer" varchar(255)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_tenant_users_keycloak_identity"
      ON "tenant_users" ("keycloak_issuer", "keycloak_subject")
      WHERE "keycloak_issuer" IS NOT NULL AND "keycloak_subject" IS NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "uq_tenant_users_keycloak_identity"');
    await queryRunner.query(`
      ALTER TABLE "tenant_users"
      DROP COLUMN "keycloak_subject",
      DROP COLUMN "keycloak_issuer"
    `);
  }
}