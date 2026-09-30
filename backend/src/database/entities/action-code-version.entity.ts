import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * ActionCodeVersion — stores versioned snapshots of action code.
 *
 * When an admin modifies action code, a new version is created rather
 * than overwriting existing code. This provides an audit trail of all
 * action code changes.
 */
@Entity('action_code_versions')
@Index(['tenant_id', 'service_id', 'action_id'])
export class ActionCodeVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  service_id: string;

  /** The action definition ID within the FormSchema. */
  @Column({ type: 'varchar', length: 255 })
  action_id: string;

  /** Monotonically increasing version number per action. */
  @Column({ type: 'int' })
  version: number;

  /** The action code at this version. */
  @Column({ type: 'text' })
  code: string;

  /** The action event type at this version. */
  @Column({ type: 'varchar', length: 50 })
  event: string;

  /** Optional target field ID. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  target_id: string | null;

  /** ID of the admin who made the change. */
  @Column({ type: 'uuid', nullable: true })
  changed_by: string | null;

  /** Human-readable change description. */
  @Column({ type: 'varchar', length: 500, nullable: true })
  change_description: string | null;

  @CreateDateColumn()
  created_at: Date;
}
