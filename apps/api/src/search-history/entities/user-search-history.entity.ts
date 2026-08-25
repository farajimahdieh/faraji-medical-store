import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

// "Similar" queries (same after Persian normalization -- ی/ي, ک/ك, ZWNJ,
// whitespace) dedupe to one row, matching the existing catalog search's own
// normalization (see common/persian-search.util.ts) so history matches what
// search actually treats as "the same query".
@Entity('user_search_histories')
@Index('UQ_search_history_user_query', ['userId', 'normalizedQuery'], {
  unique: true,
})
export class UserSearchHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  // The user's own most-recent spelling/casing of the query -- what's shown.
  @Column({ type: 'varchar', length: 200 })
  query: string;

  @Column({ type: 'varchar', length: 200 })
  normalizedQuery: string;

  @Column({ type: 'timestamptz' })
  searchedAt: Date;
}
