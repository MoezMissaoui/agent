import { randomUUID } from 'crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Agent } from './agent.entity';

@Entity('api_keys')
@Index('UQ_api_keys_agent_id_name', ['agentId', 'name'], { unique: true })
export class ApiKey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'identifier', type: 'varchar', length: 36, unique: true })
  identifier: string;

  @Column({ name: 'agent_id', type: 'int' })
  agentId: number;

  @ManyToOne(() => Agent, (a) => a.apiKeys, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agent_id' })
  agent: Agent;

  /** SHA-256 hex of the full secret (never expose). */
  @Column({ name: 'token_hash', type: 'varchar', length: 64, unique: true })
  tokenHash: string;

  /** First characters of the secret for display in lists. */
  @Column({ name: 'token_prefix', type: 'varchar', length: 24 })
  tokenPrefix: string;

  /** AES-256-GCM ciphertext (base64) so the owner can reveal the full token from the dashboard. */
  @Column({ name: 'token_secret_cipher', type: 'text', nullable: true })
  tokenSecretCipher: string | null;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @BeforeInsert()
  ensureIdentifier() {
    if (!this.identifier) {
      this.identifier = randomUUID();
    }
  }
}
