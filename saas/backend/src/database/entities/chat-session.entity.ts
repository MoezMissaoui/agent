import { randomUUID } from 'crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Agent } from './agent.entity';
import { Message } from './message.entity';

@Entity('chat_sessions')
export class ChatSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'identifier', type: 'varchar', length: 36, unique: true })
  identifier: string;

  @Column({ name: 'agent_id', type: 'int' })
  agentId: number;

  @ManyToOne(() => Agent, (a) => a.chatSessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agent_id' })
  agent: Agent;

  /** Optional user-defined label; when null, UI shows a generated title (e.g. Conversation N). */
  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Message, (m) => m.session)
  messages: Message[];

  @BeforeInsert()
  ensureIdentifier() {
    if (!this.identifier) {
      this.identifier = randomUUID();
    }
  }
}
