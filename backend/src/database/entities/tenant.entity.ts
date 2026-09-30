import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TenantUser } from './tenant-user.entity';
import { TenantService } from './tenant-service.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 63, nullable: true, unique: true })
  subdomain: string | null;

  // 'government' | 'enterprise' | 'ngo' | 'other'
  @Column({ type: 'varchar', length: 50 })
  type: string;

  // 'active' | 'suspended' | 'onboarding' | 'offboarded'
  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  api_base_url: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contact_email: string | null;

  // ─── Governance scope ───────────────────────────────────────────────────
  @Column({ type: 'jsonb', nullable: true })
  governance_scope: {
    owner_level?: 'ministry' | 'department' | 'state' | 'district' | 'district_office' | 'municipality' | 'panchayat';
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
    lgd_standard?: string;
  } | null;

  @Column({ type: 'jsonb', nullable: true })
  onboarding_metadata: Record<string, unknown> | null;

  // ─── Branding ───────────────────────────────────────────────────────────
  @Column({ type: 'jsonb', nullable: true })
  branding: {
    logo_url?: string;
    primary_color?: string;
    display_name?: string;
    support_email?: string;
    support_phone?: string;
    footer_text?: string;
  } | null;
  // ─── Auth policy ────────────────────────────────────────────────────────
  @Column({ type: 'jsonb', nullable: true })
  auth_policy: {
    mfa_required?: boolean;
    session_timeout_minutes?: number;
    allowed_email_domains?: string[];
    password_min_length?: number;
    max_login_failures?: number;
    lockout_minutes?: number;
  } | null;

  // ─── Consent policy ─────────────────────────────────────────────────────
  @Column({ type: 'jsonb', nullable: true })
  consent_policy: {
    require_consent_before_submission?: boolean;
    consent_purposes?: string[];
    consent_expiry_days?: number | null;
    data_retention_days?: number | null;
  } | null;

  // ─── Notification policy ─────────────────────────────────────────────────
  @Column({ type: 'jsonb', nullable: true })
  notification_policy: {
    email_enabled?: boolean;
    sms_enabled?: boolean;
    webhook_url?: string | null;
  } | null;

  // ─── Integration policy ──────────────────────────────────────────────────
  @Column({ type: 'jsonb', nullable: true })
  integration_policy: {
    allowed_providers?: string[];
    sandbox_mode?: boolean;
  } | null;

  // ─── Action policy ───────────────────────────────────────────────────────
  @Column({ type: 'jsonb', nullable: true })
  action_policy: {
    fetch_allowlist?: string[];
    actions_enabled?: boolean;
  } | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => TenantUser, (user) => user.tenant)
  users: TenantUser[];

  @OneToMany(() => TenantService, (service) => service.tenant)
  services: TenantService[];
}

