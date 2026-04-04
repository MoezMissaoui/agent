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
import { MessageRole } from '../enums/message-role.enum';
import { ChatSession } from './chat-session.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'identifier', type: 'varchar', length: 36, unique: true })
  identifier: string;

  @Column({ name: 'session_id', type: 'int' })
  sessionId: number;

  @ManyToOne(() => ChatSession, (s) => s.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: ChatSession;

  @Column({
    type: 'enum',
    enum: MessageRole,
    enumName: 'message_role_enum',
  })
  role: MessageRole;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @BeforeInsert()
  ensureIdentifier() {
    if (!this.identifier) {
      this.identifier = randomUUID();
    }
  }
}
