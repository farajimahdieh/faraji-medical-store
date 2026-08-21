import Image from "next/image";

// The store's real logo file (heart + ECG line + stethoscope + "F"/"M") —
// used as-is, not redrawn. Update apps/web/public/images/logo/faraji-logo.png
// directly if the source artwork ever changes.
const LOGO_WIDTH = 174;
const LOGO_HEIGHT = 144;

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-white px-2 py-1.5 ${className}`}
    >
      <Image
        src="/images/logo/faraji-logo.png"
        alt="لوگوی تجهیزات پزشکی و آزمایشگاهی فرجی"
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        priority
        className="h-8 w-auto object-contain sm:h-9"
      />
    </span>
  );
}
