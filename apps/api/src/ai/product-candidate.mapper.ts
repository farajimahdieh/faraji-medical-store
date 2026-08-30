import { Product } from '../catalog/entities/product.entity';
import { AiMessage, AiMessageRole } from './entities/ai-message.entity';
import {
  AiChatMessage,
  AiProductCandidate,
} from './providers/ai-provider.interface';

// Trims long descriptions before they ever reach a prompt -- part of the
// token-cost control described in the AI chatbot spec (never send the full
// catalog or full-length descriptions to the model).
const MAX_DESCRIPTION_LENGTH = 300;

function trim(text: string | null, maxLength: number): string | null {
  if (!text) return text;
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

export function toAiProductCandidate(product: Product): AiProductCandidate {
  return {
    id: product.id,
    name: product.name,
    shortDescription: trim(product.shortDescription, MAX_DESCRIPTION_LENGTH),
    description: trim(product.description, MAX_DESCRIPTION_LENGTH),
    category: product.category?.name ?? null,
    brand: product.brand?.name ?? null,
    variants: (product.variants ?? [])
      .filter((variant) => variant.isActive)
      .map((variant) => ({
        size: variant.size,
        price: variant.price,
        stock: variant.stock,
      })),
  };
}

export function toAiChatMessage(message: AiMessage): AiChatMessage {
  return {
    role: message.role === AiMessageRole.USER ? 'user' : 'assistant',
    content: message.content,
  };
}
