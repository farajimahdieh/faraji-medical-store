import { isOffTopicMessage } from './off-topic.util';

describe('isOffTopicMessage', () => {
  it('flags clearly off-scope requests', () => {
    expect(isOffTopicMessage('حاصل 2 + 2 چند میشه؟')).toBe(true);
    expect(isOffTopicMessage('یک کد پایتون برایم بنویس')).toBe(true);
    expect(isOffTopicMessage('نظرت راجع به انتخابات ریاست جمهوری چیه؟')).toBe(
      true,
    );
  });

  it('does not flag genuine product/medical questions', () => {
    expect(isOffTopicMessage('گردنم درد می‌کند، چه محصولی مناسب است؟')).toBe(
      false,
    );
    expect(
      isOffTopicMessage('برای کمردرد بعد از نشستن طولانی چی پیشنهاد میدی؟'),
    ).toBe(false);
  });
});
