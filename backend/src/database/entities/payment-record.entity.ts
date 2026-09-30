import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type PaymentStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export interface StatusTransition {
  from: PaymentStatus | null;
  to: PaymentStatus;
  timestamp: string; // ISO 8601
  reason?: string;
  method?: 'api' | 'webhook' | 'timeout';
}

@Entity('payment_records')
@Index('idx_payment_records_application', ['application_id'])
@Index('idx_payment_records_tenant_status', ['tenant_id', 'status'])
@Index('idx_payment_records_razorpay_order', ['razorpay_order_id'])
export class PaymentRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  application_id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  consumer_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  razorpay_order_id: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  razorpay_payment_id: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  razorpay_refund_id: string | null;

  @Column({ type: 'integer' })
  amount_paise: number;

  @Column({ type: 'varchar', length: 3, default: 'INR' })
  currency: string;

  @Column({ type: 'integer', default: 0 })
  refunded_amount_paise: number;

  @Column({ type: 'varchar', length: 30, default: 'pending' })
  status: PaymentStatus;

  @Column({ type: 'text', nullable: true })
  failure_reason: string | null;

  @Column({ type: 'integer', default: 1 })
  attempt_number: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  idempotency_key: string;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  receipt_number: string | null;

  @Column({ type: 'jsonb', default: '[]' })
  status_history: StatusTransition[];

  @Column({ type: 'timestamp with time zone', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  refunded_at: Date | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;
}
