import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AuthTokenType } from '../enums/auth-token-type.enum';
import { User } from './user.entity';

/** Jetons à usage unique (hash SHA-256) : mot de passe oublié, vérification d’e-mail. */
@Entity('user_auth_tokens')
@Index(['userId', 'type'])
export class UserAuthToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, (u) => u.authTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'token_hash', type: 'varchar', length: 64, unique: true })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt: Date;

  @Column({ type: 'varchar', length: 32 })
  type: AuthTokenType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
