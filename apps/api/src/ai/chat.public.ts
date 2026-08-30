import { PublicProductListItem } from '../catalog/products/product.public';

export interface PublicChatResponse {
  conversationId: string;
  message: string;
  products: PublicProductListItem[];
  needsMoreInfo: boolean;
}
