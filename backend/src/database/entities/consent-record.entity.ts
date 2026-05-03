import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type ConsentStatus = 'pending' | 'granted' | 'denied' | 'revoked' | 'expired';

@Entity('consent_records')
@Index('idx_consent_records_consumer', ['consumer_id', 'status'])
@Index('idx_consent_records_tenant', ['tenant_id', 'status'])
@Index('idx_consent_records_lookup', ['consumer_id', 'tenant_id', 'purpose', 'status'])
export class ConsentRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  consumer_id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  // What the consent is for: 'service_delivery', 'document_share', 'data_processing', etc.
  @Column({ type: 'varchar', length: 100 })
  purpose: string;

  @Column({ type: 'text' })
  purpose_description: string;

  // Resource type being consented to: 'service', 'document', 'profile_data'
  @Column({ type: 'varchar', length: 60, nullable: true })
  resource_type: string | null;

  // Specific resource ID (e.g., service_id, document_id)
  @Column({ type: 'varchar', length: 255, nullable: true })
  resource_id: string | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: ConsentStatus;

  // Correlation ID from the triggering transaction
  @Column({ type: 'varchar', length: 255, nullable: true })
  request_id: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  granted_at: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  denied_at: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  revoked_at: Date | null;

  // Optional expiry — if set, the consent expires at this time
  @Column({ type: 'timestamp with time zone', nullable: true })
  expires_at: Date | null;

  // Additional context — keep minimal, never store sensitive data
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
