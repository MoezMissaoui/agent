import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Agent } from './agent.entity';
import { ApiKey } from './api-key.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  /** SHA-256 hex du token brut (mot de passe oublié) */
  @Column({
    name: 'password_reset_token_hash',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  passwordResetTokenHash: string | null;

  @Column({ name: 'password_reset_expires', type: 'datetime', nullable: true })
  passwordResetExpires: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ApiKey, (k) => k.user)
  apiKeys: ApiKey[];

  @OneToMany(() => Agent, (a) => a.user)
  agents: Agent[];
}
