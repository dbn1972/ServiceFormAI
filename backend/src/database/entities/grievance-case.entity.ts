import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('grievance_cases')
@Index('idx_grievance_cases_tenant_status', ['tenant_id', 'status', 'created_at'])
@Index('idx_grievance_cases_consumer', ['consumer_id', 'created_at'])
export class GrievanceCase {
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

  @Column({ type: 'varchar', length: 120 })
  category: string;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 30, default: 'submitted' })
  status: string;

  @Column({ type: 'uuid', nullable: true })
  assigned_to: string | null;

  @Column({ type: 'text', nullable: true })
  resolution: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  resolved_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  reopened_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  due_at: Date | null;

  @Column({ type: 'jsonb', default: '[]' })
  timeline: Array<Record<string, unknown>>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}