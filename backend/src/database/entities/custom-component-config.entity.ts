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
import { Tenant } from './tenant.entity';

@Entity('custom_component_configs')
@Index('idx_custom_component_tenant', ['tenant_id'])
@Index('idx_custom_component_tenant_fieldtype', ['tenant_id', 'field_type'], {
  unique: true,
})
export class CustomComponentConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'varchar', length: 50 })
  field_type: string;

  @Column({ type: 'varchar', length: 255 })
  display_name: string;

  @Column({ type: 'varchar', length: 20 })
  version: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  bundle_url: string;

  @Column({ type: 'jsonb', nullable: true })
  validators: any;

  @Column({ type: 'jsonb', nullable: true })
  default_config: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  allowed_domains: string[];

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
