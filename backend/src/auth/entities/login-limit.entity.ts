import { Check, Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('auth_login_limits')
@Check('"attempts" >= 1')
export class LoginLimit {
  @PrimaryColumn({ type: 'text' }) scopeKey!: string;
  @Column({ type: 'integer' }) attempts!: number;
  @Column({ type: 'timestamptz' }) windowStartedAt!: Date;
  @Index('IDX_auth_login_limits_expiry')
  @Column({ type: 'timestamptz' }) expiresAt!: Date;
}
