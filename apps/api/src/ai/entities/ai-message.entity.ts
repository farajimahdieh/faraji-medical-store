import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { AiConversation } from './ai-conversation.entity';

export enum AiMessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

@Entity('ai_messages')
export class AiMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AiConversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: AiConversation;

  @Index()
  @Column({ type: 'uuid' })
  conversationId: string;

  @Column({ type: 'enum', enum: AiMessageRole })
  role: AiMessageRole;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}
