import {
  Entity,
  Column,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Application } from './application.entity';

@Entity('application_events')
@Index('idx_application_events_application', ['application_id'])
@Index('idx_application_events_tenant', ['tenant_id'])
@Index('idx_application_events_type', ['event_type'])
export class ApplicationEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  application_id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  actor_id: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  actor_role: string | null;

  @Column({ type: 'varchar', length: 60 })
  event_type: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  from_status: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  to_status: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  stage: string | null;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'jsonb', nullable: true, default: '{}' })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @ManyToOne(() => Application, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: Application;
}