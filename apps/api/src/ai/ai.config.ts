import { ConfigService } from '@nestjs/config';

export function getAiMaxOutputTokens(configService: ConfigService): number {
  return Number(configService.get('AI_MAX_OUTPUT_TOKENS', '250'));
}

export function getAiMaxProductCandidates(
  configService: ConfigService,
): number {
  return Number(configService.get('AI_MAX_PRODUCT_CANDIDATES', '6'));
}

export function getAiMaxHistoryMessages(configService: ConfigService): number {
  return Number(configService.get('AI_MAX_HISTORY_MESSAGES', '8'));
}
