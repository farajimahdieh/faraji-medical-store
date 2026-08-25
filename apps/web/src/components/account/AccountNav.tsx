"use client";

import Link from "next/link";
import { Heart, MapPin, Ticket, User } from "lucide-react";
import { useWishlist } from "@/components/wishlist/WishlistProvider";

export type AccountSection = "profile" | "addresses" | "coupons";

const TAB_ITEMS: { id: AccountSection; label: string; icon: typeof User }[] = [
  { id: "profile", label: "اطلاعات حساب", icon: User },
  { id: "addresses", label: "آدرس‌های من", icon: MapPin },
  { id: "coupons", label: "کدهای تخفیف من", icon: Ticket },
];

export function AccountNav({
  active,
  onChange,
}: {
  active: AccountSection;
  onChange: (section: AccountSection) => void;
}) {
  const { count } = useWishlist();

  return (
    <>
      {/* Desktop: vertical side nav. Under dir="rtl" the first flex child
          lands on the right automatically, satisfying "nav on the right"
          without a row-reverse trick. */}
      <nav aria-label="ناوبری حساب کاربری" className="hidden w-56 shrink-0 flex-col gap-1 lg:flex">
        {TAB_ITEMS.map((item) => (
          <NavButton
            key={item.id}
            label={item.label}
            Icon={item.icon}
            active={active === item.id}
            onClick={() => onChange(item.id)}
          />
        ))}
        <Link
          href="/wishlist"
          className="flex items-center justify-between gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-navy transition-colors hover:bg-medical-bg"
        >
          <span className="flex items-center gap-2.5">
            <Heart className="h-4.5 w-4.5" aria-hidden="true" />
            علاقه‌مندی‌ها
          </span>
          {count > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-medical-bg px-1 text-[11px] font-semibold text-primary">
              {count.toLocaleString("fa-IR")}
            </span>
          )}
        </Link>
      </nav>

      {/* Mobile: horizontal scrollable tabs. The scroll is contained to this
          bar (overflow-x-auto), never the page itself. */}
      <nav
        aria-label="ناوبری حساب کاربری"
        className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:hidden"
      >
        {TAB_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            aria-current={active === item.id ? "page" : undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              active === item.id ? "bg-primary text-white" : "border border-border text-navy"
            }`}
          >
            <item.icon className="h-4 w-4" aria-hidden="true" />
            {item.label}
          </button>
        ))}
        <Link
          href="/wishlist"
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium whitespace-nowrap text-navy"
        >
          <Heart className="h-4 w-4" aria-hidden="true" />
          علاقه‌مندی‌ها
          {count > 0 && <span className="text-xs text-secondary-text">({count.toLocaleString("fa-IR")})</span>}
        </Link>
      </nav>
    </>
  );
}

function NavButton({
  label,
  Icon,
  active,
  onClick,
}: {
  label: string;
  Icon: typeof User;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
        active ? "bg-tint-blue text-primary" : "text-navy hover:bg-medical-bg"
      }`}
    >
      <Icon className="h-4.5 w-4.5" aria-hidden="true" />
      {label}
    </button>
  );
}
