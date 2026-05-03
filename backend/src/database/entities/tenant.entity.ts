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

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => TenantUser, (user) => user.tenant)
  users: TenantUser[];

  @OneToMany(() => TenantService, (service) => service.tenant)
  services: TenantService[];
}

