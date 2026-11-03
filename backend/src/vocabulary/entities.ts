import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../auth/entities/user.entity';

@Entity('vocab_folders')
export class VocabularyFolder {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column('uuid') ownerId!: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'ownerId' }) owner!: User;
  @Column({ length: 120 }) name!: string;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
@Entity('vocab_sets')
export class VocabularySet {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column('uuid') folderId!: string;
  @ManyToOne(() => VocabularyFolder, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'folderId' }) folder!: VocabularyFolder;
  @Column({ length: 120 }) name!: string;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
@Entity('vocab_cards')
export class VocabularyCard {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column('uuid') setId!: string;
  @ManyToOne(() => VocabularySet, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'setId' }) set!: VocabularySet;
  @Column({ length: 500 }) meaning!: string;
  @Column({ length: 200 }) reading!: string;
  @Column({ length: 200, default: '' }) japanese!: string;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
