export interface Guide {
  slug: string;
  title: string;
  category: string;
  readingMinutes: number;
}

export const guides: Guide[] = [
  {
    slug: "how-to-choose-blood-pressure-monitor",
    title: "هنگام خرید فشارسنج به چه نکاتی توجه کنیم؟",
    category: "تشخیص و پایش سلامت",
    readingMinutes: 4,
  },
  {
    slug: "best-nebulizer-for-home-use",
    title: "نبولایزر مناسب مصرف خانگی کدام است؟",
    category: "تجهیزات تنفسی",
    readingMinutes: 5,
  },
  {
    slug: "wheelchair-guide-for-elderly",
    title: "راهنمای انتخاب ویلچر برای سالمندان",
    category: "ارتوپدی و توانبخشی",
    readingMinutes: 6,
  },
];
