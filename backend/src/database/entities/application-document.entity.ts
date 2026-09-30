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
import { Application } from './application.entity';

@Entity('application_documents')
@Index('idx_application_documents_application', ['application_id'])
@Index('idx_application_documents_tenant', ['tenant_id'])
@Index('idx_application_documents_type', ['document_type'])
@Index('idx_application_documents_application_type', ['application_id', 'document_type'], { unique: true })
export class ApplicationDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  application_id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  consumer_id: string;

  @Column({ type: 'uuid' })
  service_id: string;

  @Column({ type: 'uuid' })
  document_id: string;

  @Column({ type: 'varchar', length: 100 })
  document_type: string;

  @Column({ type: 'varchar', length: 255 })
  file_name: string;

  @Column({ type: 'varchar', length: 100 })
  mime_type: string;

  @Column({ type: 'integer' })
  file_size: number;

  @Column({ type: 'varchar', length: 512 })
  storage_key: string;

  @Column({ type: 'varchar', length: 30, default: 'manual' })
  upload_source: string;

  @Column({ type: 'varchar', length: 30, default: 'uploaded' })
  status: string;

  @Column({ type: 'jsonb', nullable: true, default: '{}' })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  uploaded_at: Date | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @ManyToOne(() => Application, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: Application;
}