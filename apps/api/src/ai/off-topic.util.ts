// Cheap, deterministic pre-filter for clearly off-scope requests (math,
// programming, politics, entertainment, ...) -- catching these here skips
// the AiProvider call entirely (no tokens spent), rather than relying on the
// system prompt alone. Deliberately a short, fixed pattern list, not a rule
// engine: a real LLM provider's own system-prompt instructions are the
// backstop for anything this doesn't catch.
const OFF_TOPIC_PATTERNS: RegExp[] = [
  // Basic arithmetic ("2+2", "10 * 5"). "-" is deliberately excluded here --
  // this is a medical-equipment store and "38-40" is a size range, not
  // subtraction.
  /\d\s*[+*/×÷]\s*\d/,
  /انتگرال|مشتق|معادله|لگاریتم|فاکتوریل/,
  /کد بنویس|کد بزن|برنامه‌نویسی|جاوااسکریپت|پایتون|تایپ‌اسکریپت/i,
  /رئیس‌جمهور|انتخابات ریاست|حزب سیاسی|وزیر خارجه/,
  /فیلم سینمایی پیشنهاد|آهنگ پیشنهاد|بازی کامپیوتری|سریال پیشنهاد/,
];

export function isOffTopicMessage(message: string): boolean {
  return OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(message));
}

export const OFF_TOPIC_REPLY =
  'این دستیار فقط برای راهنمایی خرید محصولات و تجهیزات پزشکی فروشگاه فرجی طراحی شده است. لطفاً سؤال خود را درباره نیاز یا محصول موردنظرتان مطرح کنید.';
