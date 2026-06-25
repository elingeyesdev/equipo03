import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/domain/user.entity';

@Entity('conversations')
@Index(['clientId', 'trainerId'], { unique: true })
export class Conversation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', name: 'client_id' })
  clientId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: User;

  @Column({ type: 'integer', name: 'trainer_id' })
  trainerId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trainer_id' })
  trainer: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
