import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('citizen_feedback')
@Index('uq_citizen_feedback_application_consumer', ['application_id', 'consumer_id'], { unique: true })
@Index('idx_citizen_feedback_tenant_status', ['tenant_id', 'status', 'created_at'])
export class CitizenFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  application_id: string;

  @Column({ type: 'uuid' })
  service_release_id: string;

  @Column({ type: 'uuid' })
  consumer_id: string;

  @Column({ type: 'smallint' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ type: 'jsonb', default: '[]' })
  tags: string[];

  @Column({ type: 'varchar', length: 30, default: 'submitted' })
  status: string;

  @Column({ type: 'uuid', nullable: true })
  assigned_to: string | null;

  @Column({ type: 'text', nullable: true })
  response: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  closed_at: Date | null;

  @Column({ type: 'jsonb', default: '[]' })
  timeline: Array<Record<string, unknown>>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}