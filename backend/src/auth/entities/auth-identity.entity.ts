import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('auth_identities')
@Index(['provider', 'providerAccountId'], { unique: true })
export class AuthIdentity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  provider!: 'password' | 'google';

  @Column()
  providerAccountId!: string;

  @ManyToOne(() => User, (user) => user.identities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId!: string;
}
