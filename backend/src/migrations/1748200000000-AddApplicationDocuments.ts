import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApplicationDocuments1748200000000 implements MigrationInterface {
  name = 'AddApplicationDocuments1748200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "application_documents" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "application_id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "consumer_id" uuid NOT NULL,
        "service_id" uuid NOT NULL,
        "document_id" uuid NOT NULL,
        "document_type" varchar(100) NOT NULL,
        "file_name" varchar(255) NOT NULL,
        "mime_type" varchar(100) NOT NULL,
        "file_size" integer NOT NULL,
        "storage_key" varchar(512) NOT NULL,
        "upload_source" varchar(30) NOT NULL DEFAULT 'manual',
        "status" varchar(30) NOT NULL DEFAULT 'uploaded',
        "metadata" jsonb DEFAULT '{}',
        "uploaded_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_application_documents" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_application_documents_application_type" UNIQUE ("application_id", "document_type")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_application_documents_application" ON "application_documents" ("application_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_application_documents_tenant" ON "application_documents" ("tenant_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_application_documents_type" ON "application_documents" ("document_type")
    `);

    await queryRunner.query(`
      ALTER TABLE "application_documents"
      ADD CONSTRAINT "FK_application_documents_application"
      FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "application_documents" DROP CONSTRAINT "FK_application_documents_application"`);
    await queryRunner.query(`DROP INDEX "idx_application_documents_type"`);
    await queryRunner.query(`DROP INDEX "idx_application_documents_tenant"`);
    await queryRunner.query(`DROP INDEX "idx_application_documents_application"`);
    await queryRunner.query(`DROP TABLE "application_documents"`);
  }
}