import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('teams')
@Index(['group'])
@Index(['order'])
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  fa_name: string;

  @Column({ type: 'varchar', length: 100 })
  eng_name: string;

  @Column({ type: 'integer', nullable: true })
  order: number;

  @Column({ type: 'varchar', length: 1, nullable: true })
  group: string | null;

  @Column({ type: 'text' })
  flag: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
