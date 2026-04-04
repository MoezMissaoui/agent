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
import { User } from './user.entity';
import { ChatSession } from './chat-session.entity';
import { Document } from './document.entity';

@Entity('agents')
export class Agent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'identifier', type: 'varchar', length: 36, unique: true })
  identifier: string;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @ManyToOne(() => User, (u) => u.agents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'system_prompt', type: 'text', nullable: true })
  systemPrompt: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Document, (d) => d.agent)
  documents: Document[];

  @OneToMany(() => ChatSession, (s) => s.agent)
  chatSessions: ChatSession[];

  @BeforeInsert()
  ensureIdentifier() {
    if (!this.identifier) {
      this.identifier = randomUUID();
    }
  }
}
