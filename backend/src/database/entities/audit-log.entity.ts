import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type AuditEventType =
  | 'auth.login.success'
  | 'auth.login.failure'
  | 'auth.logout'
  | 'auth.register'
  | 'auth.token.refresh'
  | 'auth.token.invalid'
  | 'admin.service.create'
  | 'admin.service.update'
  | 'admin.service.delete'
  | 'admin.service.publish'
  | 'admin.application.status_update'
  | 'document.upload'
  | 'document.download'
  | 'application.submit'
  | 'consent.grant'
  | 'consent.granted'
  | 'consent.revoke'
  | 'consent.revoked'
  | 'consent.deny'
  | 'consent.denied'
  | 'consent.requested'
  | 'consent.admin_revoked'
  | 'consent.bulk_revoked'
  | 'tenant.created'
  | 'tenant.updated'
  | 'tenant.activated'
  | 'tenant.suspended'
  | 'tenant.offboarded'
  | 'service.created'
  | 'service.updated'
  | 'service.deleted'
  | 'validation.success'
  | 'validation.failure'
  | 'component.created'
  | 'component.updated'
  | 'component.deleted'
  | 'action.execution.success'
  | 'action.execution.error'
  | 'action.execution.timeout'
  | 'action.execution.rate_limited'
  | 'action.security.violation'
  | 'payment.order.created'
  | 'payment.verified'
  | 'payment.verification.failed'
  | 'payment.refund.initiated'
  | 'payment.refund.completed'
  | 'payment.webhook.received';

@Entity('audit_logs')
@Index('idx_audit_logs_actor', ['actor_id', 'created_at'])
@Index('idx_audit_logs_tenant', ['tenant_id', 'created_at'])
@Index('idx_audit_logs_event_type', ['event_type', 'created_at'])
@Index('idx_audit_logs_resource', ['resource_type', 'resource_id'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 60 })
  event_type: AuditEventType;

  @Column({ type: 'uuid', nullable: true })
  actor_id: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  actor_role: string | null;

  @Column({ type: 'uuid', nullable: true })
  tenant_id: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  resource_type: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resource_id: string | null;

  // Structured metadata — keep minimal; never store raw credentials or PII beyond identifiers
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'boolean', default: true })
  success: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;
}
