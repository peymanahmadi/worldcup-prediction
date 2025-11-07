import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { PredictionResult } from './prediction-result.entity';

@Entity('predictions')
@Index(['user_id'])
@Index(['is_finalized'])
export class Prediction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  user_id: string;

  @Column({ type: 'jsonb' })
  predict: {
    [key: string]: string[][]; // { "A": [["uuid1"], ["uuid2"], ["uuid3"], ["uuid4"]], "B": [...], ... }
  };

  @Column({ type: 'boolean', default: false })
  is_finalized: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  submitted_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => PredictionResult, (result) => result.prediction)
  results: PredictionResult[];
}
