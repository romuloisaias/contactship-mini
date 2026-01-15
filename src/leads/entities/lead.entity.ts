import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum LeadSource {
  MANUAL = 'manual',
  EXTERNAL = 'external',
}

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: LeadSource,
    default: LeadSource.MANUAL,
  })
  source: LeadSource;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'text', nullable: true })
  next_action: string;

  @Index({ unique: true })
  @Column({ nullable: true })
  external_id: string; // ID from randomuser.me or composite key to prevent duplicates

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}