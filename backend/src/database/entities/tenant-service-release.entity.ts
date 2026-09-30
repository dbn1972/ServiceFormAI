import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('tenant_service_releases')
@Index('uq_tenant_service_release_version', ['service_id', 'version'], { unique: true })
@Index('idx_tenant_service_releases_tenant', ['tenant_id', 'service_id'])
export class TenantServiceRelease {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  service_id: string;

  @Column({ type: 'integer' })
  version: number;

  @Column({ type: 'jsonb' })
  snapshot: Record<string, unknown>;

  @Column({ type: 'varchar', length: 64 })
  content_hash: string;

  @CreateDateColumn({ type: 'timestamptz' })
  published_at: Date;
}