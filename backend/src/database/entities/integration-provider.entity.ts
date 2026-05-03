import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type IntegrationStatus = 'active' | 'disabled' | 'error' | 'sandbox';
export type IntegrationProviderKey =
  | 'digilocker'
  | 'aadhaar_otp'
  | 'razorpay'
  | 'payu'
  | 'sendgrid'
  | 'twilio'
  | 'aws_s3'
  | 'azure_blob'
  | 'custom_webhook';

@Entity('integration_providers')
@Index('idx_integration_providers_tenant_provider', ['tenant_id', 'provider'], { unique: true })
@Index('idx_integration_providers_tenant_status', ['tenant_id', 'status'])
export class IntegrationProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  // Canonical provider key — one record per provider per tenant
  @Column({ type: 'varchar', length: 60 })
  provider: string;

  // 'active' | 'disabled' | 'error' | 'sandbox'
  @Column({ type: 'varchar', length: 20, default: 'disabled' })
  status: IntegrationStatus;

  // Non-secret configuration: base URLs, feature flags, callback paths
  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, unknown> | null;

  // Credential reference — stores KEYS/NAMES only, never raw secrets.
  // Values must be resolved from an external secret store (env, vault, SSM).
  // Example: { "api_key_ref": "RAZORPAY_KEY_ID_<tenantId>", "secret_ref": "RAZORPAY_KEY_SECRET_<tenantId>" }
  @Column({ type: 'jsonb', nullable: true })
  credential_refs: Record<string, string> | null;

  // Webhook/callback signing secret reference (name only, never the secret itself)
  @Column({ type: 'varchar', length: 255, nullable: true })
  webhook_secret_ref: string | null;

  // Health tracking
  @Column({ type: 'timestamp with time zone', nullable: true })
  last_health_check_at: Date | null;

  @Column({ type: 'boolean', nullable: true })
  last_health_check_ok: boolean | null;

  @Column({ type: 'text', nullable: true })
  last_error: string | null;

  // Retry / circuit-breaker counters
  @Column({ type: 'integer', default: 0 })
  consecutive_failures: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  circuit_open_until: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
