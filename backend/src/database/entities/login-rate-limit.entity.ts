import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('login_rate_limits')
@Index('idx_login_rate_limits_identifier_ip', ['identifier_hash', 'ip_address'], { unique: true })
export class LoginRateLimit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // SHA-256 hash of lowercased identifier — never store raw PII in rate-limit tables
  @Column({ type: 'varchar', length: 64 })
  identifier_hash: string;

  @Column({ type: 'varchar', length: 45 })
  ip_address: string;

  @Column({ type: 'integer', default: 1 })
  failure_count: number;

  @Column({ type: 'timestamp with time zone' })
  window_started_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  locked_until: Date | null;

  @UpdateDateColumn()
  updated_at: Date;
}
