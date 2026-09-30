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

export interface SchemaVersionSnapshot {
  version: number;
  schema: object;
  updatedAt: string; // ISO 8601
}

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

  @Column({ type: 'jsonb', nullable: true })
  service_scope: {
    owner_level?: 'ministry' | 'department' | 'state' | 'district';
    monitoring_mode?: 'central' | 'state' | 'district' | 'department';
    jurisdiction_model?: 'central' | 'state' | 'district' | 'urban_local_body' | 'rural_local_body' | 'mixed';
    ministry_code?: string;
    ministry_name?: string;
    department_code?: string;
    department_name?: string;
    state_lgd_code?: string;
    state_name?: string;
    district_lgd_code?: string;
    district_name?: string;
    subdistrict_lgd_code?: string;
    subdistrict_name?: string;
    lgd_standard?: string;
    block_lgd_code?: string;
    block_name?: string;
    tehsil_code?: string;
    tehsil_name?: string;
    taluka_code?: string;
    taluka_name?: string;
    municipality_lgd_code?: string;
    municipality_name?: string;
    ulb_type?: 'municipal_corporation' | 'municipality' | 'nagar_panchayat' | 'town_panchayat' | 'other';
    panchayat_lgd_code?: string;
    panchayat_name?: string;
    gram_panchayat_code?: string;
    gram_panchayat_name?: string;
    ward_code?: string;
    ward_name?: string;
    village_code?: string;
    village_name?: string;
  } | null;

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

  @Column({ type: 'jsonb', nullable: true })
  manifest: any;

  @Column({ type: 'boolean', default: false })
  published: boolean;

  @Column({ type: 'boolean', default: false })
  archived: boolean;

  @Column({ type: 'integer', nullable: true })
  sla_days: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fees: number;

  @Column({ type: 'integer', default: 1 })
  schema_version: number;

  @Column({ type: 'uuid', nullable: true })
  current_release_id: string | null;

  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  schema_version_history: SchemaVersionSnapshot[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.services)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
