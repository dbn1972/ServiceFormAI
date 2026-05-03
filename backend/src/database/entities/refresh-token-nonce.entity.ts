import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('refresh_token_nonces')
@Index('idx_refresh_nonces_nonce', ['nonce'], { unique: true })
@Index('idx_refresh_nonces_user', ['user_id', 'revoked_at'])
export class RefreshTokenNonce {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  // 'tenant' | 'consumer'
  @Column({ type: 'varchar', length: 10 })
  user_type: string;

  // UUID stored as the 'jti' claim in the refresh token
  @Column({ type: 'varchar', length: 36 })
  nonce: string;

  @Column({ type: 'timestamp with time zone' })
  expires_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  revoked_at: Date | null;

  @CreateDateColumn()
  created_at: Date;
}
