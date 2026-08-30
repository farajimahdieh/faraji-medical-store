import { Injectable } from '@nestjs/common';
import {
  AiProvider,
  AiProviderInput,
  AiProviderResponse,
} from './ai-provider.interface';

const MAX_SUGGESTED_PRODUCTS = 3;

const CLARIFYING_QUESTION =
  'برای اینکه بهتر راهنمایی‌تان کنم، درد بیشتر هنگام خواب است یا در طول روز؟';

// Development-only stand-in -- doesn't call any real LLM, just exercises the
// AiService orchestration end-to-end (candidate lookup, id validation,
// conversation persistence) so a real provider (e.g. OpenAiProvider) can be
// swapped in later via AI_PROVIDER without touching AiService. Same role as
// MockPaymentProvider/MockSmsProvider.
@Injectable()
export class MockAiProvider implements AiProvider {
  async generateResponse(input: AiProviderInput): Promise<AiProviderResponse> {
    if (input.products.length === 0) {
      return {
        message: CLARIFYING_QUESTION,
        suggestedProductIds: [],
        needsMoreInfo: true,
      };
    }

    const picked = input.products.slice(0, MAX_SUGGESTED_PRODUCTS);
    const names = picked.map((product) => product.name).join('، ');

    return {
      message: `با توجه به نیاز شما، این گزینه‌ها می‌توانند مناسب باشند: ${names}.`,
      suggestedProductIds: picked.map((product) => product.id),
      needsMoreInfo: false,
    };
  }
}
