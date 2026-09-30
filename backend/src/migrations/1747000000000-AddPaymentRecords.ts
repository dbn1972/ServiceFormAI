import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentRecords1747000000000 implements MigrationInterface {
  name = 'AddPaymentRecords1747000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "payment_records" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "application_id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "consumer_id" uuid NOT NULL,
        "razorpay_order_id" varchar(255),
        "razorpay_payment_id" varchar(255),
        "razorpay_refund_id" varchar(255),
        "amount_paise" integer NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'INR',
        "refunded_amount_paise" integer NOT NULL DEFAULT 0,
        "status" varchar(30) NOT NULL DEFAULT 'pending',
        "failure_reason" text,
        "attempt_number" integer NOT NULL DEFAULT 1,
        "idempotency_key" varchar(255) NOT NULL,
        "receipt_number" varchar(100),
        "status_history" jsonb NOT NULL DEFAULT '[]',
        "completed_at" TIMESTAMP WITH TIME ZONE,
        "refunded_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payment_records" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_payment_records_idempotency_key" UNIQUE ("idempotency_key"),
        CONSTRAINT "UQ_payment_records_receipt_number" UNIQUE ("receipt_number")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_payment_records_application" ON "payment_records" ("application_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_payment_records_tenant_status" ON "payment_records" ("tenant_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_payment_records_razorpay_order" ON "payment_records" ("razorpay_order_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_payment_records_razorpay_order"`);
    await queryRunner.query(`DROP INDEX "idx_payment_records_tenant_status"`);
    await queryRunner.query(`DROP INDEX "idx_payment_records_application"`);
    await queryRunner.query(`DROP TABLE "payment_records"`);
  }
}
