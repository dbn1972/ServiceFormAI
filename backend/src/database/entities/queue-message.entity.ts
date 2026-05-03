import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type QueueMessageStatus = 'queued' | 'processing' | 'processed' | 'failed';

@Entity('queue_messages')
@Index('idx_queue_messages_status_available', ['status', 'available_at'])
@Index('idx_queue_messages_idempotency', ['idempotency_key'], { unique: true })
@Index('idx_queue_messages_type_status', ['type', 'status'])
export class QueueMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  provider: string;

  @Column({ type: 'varchar', length: 120 })
  type: string;

  @Column({ type: 'varchar', length: 160 })
  module: string;

  @Column({ type: 'jsonb' })
  payload: any;

  @Column({ type: 'varchar', length: 255 })
  idempotency_key: string;

  @Column({ type: 'varchar', length: 20, default: 'queued' })
  status: QueueMessageStatus;

  @Column({ type: 'integer', default: 0 })
  attempts: number;

  @Column({ type: 'text', nullable: true })
  last_error: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  claimed_at: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  processed_at: Date | null;

  @Column({ type: 'timestamp with time zone' })
  available_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
