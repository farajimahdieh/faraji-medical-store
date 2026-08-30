import { MockAiProvider } from './mock-ai-provider';
import { AiProductCandidate } from './ai-provider.interface';

function buildCandidate(
  overrides: Partial<AiProductCandidate> = {},
): AiProductCandidate {
  return {
    id: 'p1',
    name: 'بالش طبی گردن',
    shortDescription: null,
    description: null,
    category: 'گردن',
    brand: null,
    variants: [],
    ...overrides,
  };
}

describe('MockAiProvider', () => {
  const provider = new MockAiProvider();

  it('asks a clarifying question when there are no product candidates', async () => {
    const result = await provider.generateResponse({
      systemPrompt: 'x',
      messages: [],
      products: [],
      maxOutputTokens: 250,
    });

    expect(result.needsMoreInfo).toBe(true);
    expect(result.suggestedProductIds).toEqual([]);
    expect(result.message.length).toBeGreaterThan(0);
  });

  it('suggests at most 3 products, only from the given candidates', async () => {
    const products = [
      buildCandidate({ id: 'p1' }),
      buildCandidate({ id: 'p2' }),
      buildCandidate({ id: 'p3' }),
      buildCandidate({ id: 'p4' }),
    ];

    const result = await provider.generateResponse({
      systemPrompt: 'x',
      messages: [],
      products,
      maxOutputTokens: 250,
    });

    expect(result.needsMoreInfo).toBe(false);
    expect(result.suggestedProductIds).toHaveLength(3);
    expect(
      result.suggestedProductIds.every((id) =>
        ['p1', 'p2', 'p3', 'p4'].includes(id),
      ),
    ).toBe(true);
  });
});
