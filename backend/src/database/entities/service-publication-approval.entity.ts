import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('service_publication_approvals')
@Index('uq_service_publication_pending', ['service_id'], { unique: true, where: 'status = \'pending\'' })
@Index('idx_service_publication_approvals_tenant_status', ['tenant_id', 'status', 'created_at'])
export class ServicePublicationApproval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  service_id: string;

  @Column({ type: 'uuid' })
  requested_by_id: string;

  @Column({ type: 'uuid', nullable: true })
  approved_by_id: string | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: 'pending' | 'approved' | 'rejected';

  @Column({ type: 'varchar', length: 64 })
  requested_content_hash: string;

  @Column({ type: 'text', nullable: true })
  decision_notes: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  resolved_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}