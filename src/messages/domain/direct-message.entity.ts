import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/domain/user.entity';
import { Conversation } from './conversation.entity';

@Entity('direct_messages')
export class DirectMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', name: 'conversation_id' })
  conversationId: number;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Column({ type: 'integer', name: 'sender_id' })
  senderId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'boolean', name: 'deleted_for_sender', default: false })
  deletedForSender: boolean;

  @Column({ type: 'boolean', name: 'deleted_for_receiver', default: false })
  deletedForReceiver: boolean;

  @Column({ type: 'boolean', name: 'is_deleted_for_all', default: false })
  isDeletedForAll: boolean;

  @Column({ type: 'timestamp', name: 'read_at', nullable: true, default: null })
  readAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
