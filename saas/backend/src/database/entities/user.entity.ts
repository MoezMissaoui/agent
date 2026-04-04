import { randomUUID } from 'crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Agent } from './agent.entity';
import { ApiKey } from './api-key.entity';
import { UserAuthToken } from './user-auth-token.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  /** Identifiant public (JWT `sub`, API) — distinct de la clé primaire `id`. */
  @Column({ name: 'identifier', type: 'varchar', length: 36, unique: true })
  identifier: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true, length: 32 })
  username: string;

  /** Null si compte créé uniquement via OAuth (ex. Google). */
  @Column({ type: 'varchar', nullable: true })
  password: string | null;

  /** Sujet Google OpenID — liaison compte. */
  @Column({ name: 'google_id', type: 'varchar', length: 255, nullable: true, unique: true })
  googleId: string | null;

  /** Date de confirmation d’e-mail (inscription classique) ; null = non vérifié. OAuth Google : renseigné à la création. */
  @Column({ name: 'email_verified_at', type: 'datetime', nullable: true })
  emailVerifiedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ApiKey, (k) => k.user)
  apiKeys: ApiKey[];

  @OneToMany(() => Agent, (a) => a.user)
  agents: Agent[];

  @OneToMany(() => UserAuthToken, (t) => t.user)
  authTokens: UserAuthToken[];

  @BeforeInsert()
  ensureIdentifier() {
    if (!this.identifier) {
      this.identifier = randomUUID();
    }
  }
}
