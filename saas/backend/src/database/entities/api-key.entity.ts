import { randomUUID } from 'crypto';
import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'identifier', type: 'varchar', length: 36, unique: true })
  identifier: string;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @ManyToOne(() => User, (u) => u.apiKeys, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ unique: true })
  token: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @BeforeInsert()
  ensureIdentifier() {
    if (!this.identifier) {
      this.identifier = randomUUID();
    }
  }
}
