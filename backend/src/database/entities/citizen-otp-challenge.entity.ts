import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('citizen_otp_challenges')
@Index('idx_citizen_otp_mobile_created', ['mobile_e164', 'created_at'])
export class CitizenOtpChallenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 16 })
  mobile_e164: string;

  @Column({ type: 'varchar', length: 64 })
  code_digest: string;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @Column({ type: 'timestamptz' })
  resend_available_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  consumed_at: Date | null;

  @Column({ type: 'smallint', default: 0 })
  failed_attempts: number;

  @Column({ type: 'smallint', default: 5 })
  max_attempts: number;

  @Column({ type: 'varchar', length: 64 })
  request_ip_hash: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}