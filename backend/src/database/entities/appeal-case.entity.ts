import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('appeal_cases')
@Index('uq_appeal_cases_application', ['application_id'], { unique: true })
@Index('idx_appeal_cases_tenant_status', ['tenant_id', 'status', 'created_at'])
export class AppealCase {
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

  @Column({ type: 'uuid' })
  original_decision_event_id: string;

  @Column({ type: 'uuid', nullable: true })
  original_decision_actor_id: string | null;

  @Column({ type: 'varchar', length: 50 })
  original_decision: string;

  @Column({ type: 'varchar', length: 120 })
  grounds: string;

  @Column({ type: 'text' })
  statement: string;

  @Column({ type: 'varchar', length: 30, default: 'submitted' })
  status: string;

  @Column({ type: 'uuid', nullable: true })
  assigned_to: string | null;

  @Column({ type: 'uuid', nullable: true })
  decided_by: string | null;

  @Column({ type: 'text', nullable: true })
  decision_reason: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  decided_at: Date | null;

  @Column({ type: 'timestamptz' })
  submitted_at: Date;

  @Column({ type: 'timestamptz' })
  appeal_deadline: Date;

  @Column({ type: 'jsonb', default: '[]' })
  timeline: Array<Record<string, unknown>>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}