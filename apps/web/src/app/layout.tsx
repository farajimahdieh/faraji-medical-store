import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "فروشگاه تجهیزات پزشکی",
  description: "فروشگاه آنلاین تجهیزات پزشکی",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white font-sans">
        <header className="border-b border-sky-100 bg-white">
          <nav className="mx-auto flex max-w-3xl items-center gap-6 px-6 py-4 text-sm">
            <Link href="/" className="font-bold text-red-600">
              فروشگاه تجهیزات پزشکی
            </Link>
            <Link
              href="/account"
              className="text-slate-500 transition-colors hover:text-sky-600"
            >
              حساب کاربری
            </Link>
          </nav>
        </header>
        <main className="flex flex-1 flex-col bg-sky-50/50">{children}</main>
      </body>
    </html>
  );
}
