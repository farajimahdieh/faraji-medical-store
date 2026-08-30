export const AI_PROVIDER = Symbol('AI_PROVIDER');

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiProductCandidateVariant {
  size: string;
  price: number | null;
  stock: number | null;
}

// Deliberately thin -- no images/ids-for-display, just what the model needs
// to reason about which product (if any) fits the shopper's need. See
// product-candidate.mapper.ts for how a full Product entity becomes this.
export interface AiProductCandidate {
  id: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  category: string | null;
  brand: string | null;
  variants: AiProductCandidateVariant[];
}

export interface AiProviderInput {
  systemPrompt: string;
  messages: AiChatMessage[];
  products: AiProductCandidate[];
  maxOutputTokens: number;
}

export interface AiProviderResponse {
  message: string;
  // Must be a subset of the `products` ids given in the input -- AiService
  // re-validates this against the real candidate list before trusting it,
  // since a provider must never be allowed to invent a product.
  suggestedProductIds: string[];
  needsMoreInfo: boolean;
}

// Kept to one method so a real LLM integration (OpenAI, etc.) can later
// implement this as a drop-in replacement for MockAiProvider, without
// AiService ever changing -- same role as PaymentProvider/StorageProvider.
export interface AiProvider {
  generateResponse(input: AiProviderInput): Promise<AiProviderResponse>;
}
