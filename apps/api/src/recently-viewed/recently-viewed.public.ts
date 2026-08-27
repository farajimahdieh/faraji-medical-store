import { RecentlyViewedProduct } from './entities/recently-viewed-product.entity';
import {
  PublicProductListItem,
  toPublicProductListItem,
} from '../catalog/products/product.public';

export interface PublicRecentlyViewedItem extends PublicProductListItem {
  viewedAt: Date;
}

export function toPublicRecentlyViewedItem(
  entry: RecentlyViewedProduct,
  resolveUrl: (key: string) => string,
): PublicRecentlyViewedItem {
  return {
    ...toPublicProductListItem(entry.product, resolveUrl),
    viewedAt: entry.viewedAt,
  };
}
