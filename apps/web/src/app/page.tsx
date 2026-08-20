import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <span className="rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-700">
        فروشگاه معتبر تجهیزات پزشکی
      </span>
      <h1 className="text-3xl font-bold text-slate-800">
        فروشگاه تجهیزات پزشکی
      </h1>
      <p className="max-w-md leading-7 text-slate-500">
        این پروژه در حال ساخت است. فعلاً فقط ورود و ثبت‌نام با شماره موبایل
        فعال شده.
      </p>
      <Link
        href="/login"
        className="rounded-full bg-red-600 px-8 py-3 font-medium text-white shadow-sm shadow-red-200 transition-colors hover:bg-red-700"
      >
        ورود / ثبت‌نام
      </Link>
    </div>
  );
}
