import {
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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'agent_id' })
  agentId: string;

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
}
