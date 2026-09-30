import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('outbox_events')
@Index('uq_outbox_events_idempotency', ['idempotency_key'], { unique: true })
@Index('idx_outbox_events_status_created', ['status', 'created_at'])
export class OutboxEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  event_type: string;

  @Column({ type: 'varchar', length: 120 })
  aggregate_type: string;

  @Column({ type: 'uuid' })
  aggregate_id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ type: 'varchar', length: 255 })
  idempotency_key: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: 'pending' | 'processing' | 'published' | 'failed';

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}