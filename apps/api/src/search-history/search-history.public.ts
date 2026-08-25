import { UserSearchHistory } from './entities/user-search-history.entity';

export interface PublicSearchHistoryItem {
  id: string;
  query: string;
  searchedAt: Date;
}

export function toPublicSearchHistoryItem(
  entry: UserSearchHistory,
): PublicSearchHistoryItem {
  return {
    id: entry.id,
    query: entry.query,
    searchedAt: entry.searchedAt,
  };
}
