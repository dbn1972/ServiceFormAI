import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApplicationHistory1748300000000 implements MigrationInterface {
  name = 'AddApplicationHistory1748300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "application_events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "application_id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "actor_id" uuid,
        "actor_role" varchar(50),
        "event_type" varchar(60) NOT NULL,
        "from_status" varchar(50),
        "to_status" varchar(50),
        "stage" varchar(100),
        "title" varchar(255) NOT NULL,
        "notes" text,
        "metadata" jsonb DEFAULT '{}',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_application_events" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_application_events_application" ON "application_events" ("application_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_application_events_tenant" ON "application_events" ("tenant_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_application_events_type" ON "application_events" ("event_type")
    `);

    await queryRunner.query(`
      ALTER TABLE "application_events"
      ADD CONSTRAINT "FK_application_events_application"
      FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "application_deficiencies" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "application_id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "raised_by_id" uuid,
        "raised_by_role" varchar(50),
        "title" varchar(255) NOT NULL,
        "description" text NOT NULL,
        "status" varchar(30) NOT NULL DEFAULT 'open',
        "due_at" TIMESTAMP WITH TIME ZONE,
        "resolved_at" TIMESTAMP WITH TIME ZONE,
        "resolution_notes" text,
        "metadata" jsonb DEFAULT '{}',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_application_deficiencies" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_application_deficiencies_application" ON "application_deficiencies" ("application_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_application_deficiencies_tenant" ON "application_deficiencies" ("tenant_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_application_deficiencies_status" ON "application_deficiencies" ("status")
    `);

    await queryRunner.query(`
      ALTER TABLE "application_deficiencies"
      ADD CONSTRAINT "FK_application_deficiencies_application"
      FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "application_deficiencies" DROP CONSTRAINT "FK_application_deficiencies_application"`);
    await queryRunner.query(`DROP INDEX "idx_application_deficiencies_status"`);
    await queryRunner.query(`DROP INDEX "idx_application_deficiencies_tenant"`);
    await queryRunner.query(`DROP INDEX "idx_application_deficiencies_application"`);
    await queryRunner.query(`DROP TABLE "application_deficiencies"`);

    await queryRunner.query(`ALTER TABLE "application_events" DROP CONSTRAINT "FK_application_events_application"`);
    await queryRunner.query(`DROP INDEX "idx_application_events_type"`);
    await queryRunner.query(`DROP INDEX "idx_application_events_tenant"`);
    await queryRunner.query(`DROP INDEX "idx_application_events_application"`);
    await queryRunner.query(`DROP TABLE "application_events"`);
  }
}