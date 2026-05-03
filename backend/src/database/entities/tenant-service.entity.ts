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
import { Tenant } from './tenant.entity';

@Entity('tenant_services')
@Index('idx_tenant_services_tenant', ['tenant_id'])
@Index('idx_tenant_services_published_category', ['published', 'category'])
export class TenantService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  form_schema: any;

  @Column({ type: 'jsonb' })
  workflow_config: any;

  @Column({ type: 'jsonb', nullable: true })
  eligibility_rules: any;

  @Column({ type: 'jsonb', nullable: true })
  required_documents: any;

  @Column({ type: 'jsonb', nullable: true })
  backend_api_config: any;

  @Column({ type: 'boolean', default: false })
  published: boolean;

  @Column({ type: 'integer', nullable: true })
  sla_days: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fees: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.services)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
