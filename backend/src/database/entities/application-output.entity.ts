import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Application } from './application.entity';

@Entity('application_outputs')
@Index('idx_application_outputs_consumer', ['consumer_id', 'issued_at'])
@Index('idx_application_outputs_tenant', ['tenant_id', 'issued_at'])
export class ApplicationOutput {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  application_id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  consumer_id: string;

  @Column({ type: 'varchar', length: 40, unique: true })
  certificate_number: string;

  @Column({ type: 'varchar', length: 30, default: 'issued' })
  status: string;

  @Column({ type: 'varchar', length: 20, default: 'PDF' })
  format: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  storage_key: string | null;

  @Column({ type: 'varchar', length: 120, unique: true })
  verification_code: string;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, unknown>;

  @Column({ type: 'timestamptz' })
  issued_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => Application, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: Application;
}
