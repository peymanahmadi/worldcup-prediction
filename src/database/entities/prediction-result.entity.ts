import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToOne,
} from 'typeorm';
import { Prediction } from './prediction.entity';
import { User } from './user.entity';

@Entity('prediction_results')
@Index(['user_id'])
@Index(['total_score'])
@Index(['processed_at'])
export class PredictionResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  prediction_id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'integer' })
  total_score: number;

  @Column({ type: 'jsonb' })
  details: {
    applied_rule: string; // state_1, state_2, etc.
    total_misplaced?: number;
    iran_correct?: boolean;
    complete_groups?: string[];
    partial_matches?: { [key: string]: number };
    correct_teams?: number;
    explanation?: string;
  };

  @Column({ type: 'timestamptz' })
  processed_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  // Relations
  @OneToOne(() => Prediction, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prediction_id' })
  prediction: Prediction;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
