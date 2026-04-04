import { randomUUID } from 'crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DocumentStatus } from '../enums/document-status.enum';
import { Agent } from './agent.entity';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'identifier', type: 'varchar', length: 36, unique: true })
  identifier: string;

  @Column({ name: 'agent_id', type: 'int' })
  agentId: number;

  @ManyToOne(() => Agent, (a) => a.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agent_id' })
  agent: Agent;

  @Column()
  filename: string;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    enumName: 'document_status_enum',
    default: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @BeforeInsert()
  ensureIdentifier() {
    if (!this.identifier) {
      this.identifier = randomUUID();
    }
  }
}
