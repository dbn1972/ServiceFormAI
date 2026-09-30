import {
  Entity,
  Column,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('applications')
@Index('idx_applications_tenant_status', ['tenant_id', 'status'])
@Index('idx_applications_consumer_status', ['consumer_id', 'status'])
@Index('idx_applications_service', ['service_id'])
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  service_id: string;

  @Column({ type: 'uuid', nullable: true })
  service_release_id: string | null;

  @Column({ type: 'uuid' })
  consumer_id: string;

  @Column({ type: 'varchar', length: 50 })
  consumer_source: string;

  @Column({ type: 'jsonb' })
  form_data: any;

  @Column({ type: 'varchar', length: 50 })
  status: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  current_stage: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  tracking_number: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  backend_reference_id: string;

  @Column({ type: 'uuid', nullable: true })
  assigned_to: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  idempotency_key: string | null;

  @Column({ type: 'integer', nullable: true })
  schema_version: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  offline_submitted_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
