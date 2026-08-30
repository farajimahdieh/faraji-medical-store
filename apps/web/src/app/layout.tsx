import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { AppProviders } from "@/components/providers/AppProviders";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "تجهیزات پزشکی و آزمایشگاهی فرجی",
  description:
    "بیش از ۱۵ سال تجربه فروش حضوری در تبریز، همراه با مشاوره صادقانه پیش از خرید",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-white font-sans text-navy antialiased">
        <AppProviders>
          <SiteChrome>{children}</SiteChrome>
        </AppProviders>
      </body>
    </html>
  );
}
