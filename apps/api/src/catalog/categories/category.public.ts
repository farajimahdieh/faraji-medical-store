import { Category } from '../entities/category.entity';

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  parent: { name: string; slug: string } | null;
}

export function toPublicCategory(category: Category): PublicCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    parent: category.parent
      ? { name: category.parent.name, slug: category.parent.slug }
      : null,
  };
}
