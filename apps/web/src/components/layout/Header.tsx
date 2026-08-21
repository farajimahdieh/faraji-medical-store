import { Heart, ShoppingCart, User } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/icons/Logo";
import { Container } from "@/components/ui/Container";
import { mainNavLinks } from "@/data/navigation";
import { MegaMenu } from "./MegaMenu";
import { MobileMenu } from "./MobileMenu";
import { SearchBar } from "./SearchBar";

const WISHLIST_COUNT = 3;
const CART_COUNT = 2;

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur">
      <Container className="flex h-20 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
          <span className="hidden flex-col sm:flex">
            <span className="text-sm font-bold text-navy md:text-base">
              تجهیزات پزشکی و آزمایشگاهی فرجی
            </span>
            <span className="text-xs text-secondary-text">
              Faraji Medical / Laboratory Equipment
            </span>
          </span>
        </Link>

        <SearchBar className="hidden max-w-md flex-1 lg:block" />

        <div className="flex items-center gap-1">
          <HeaderIconLink href="/account" label="حساب کاربری">
            <User className="h-5 w-5" aria-hidden="true" />
          </HeaderIconLink>
          <HeaderIconLink href="/wishlist" label="علاقه‌مندی‌ها" badge={WISHLIST_COUNT}>
            <Heart className="h-5 w-5" aria-hidden="true" />
          </HeaderIconLink>
          <HeaderIconLink href="/cart" label="سبد خرید" badge={CART_COUNT}>
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
          </HeaderIconLink>
          <MobileMenu />
        </div>
      </Container>

      <div className="hidden border-t border-border lg:block">
        <Container className="flex h-12 items-center gap-8">
          <MegaMenu />
          {mainNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-navy transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </Container>
      </div>
    </header>
  );
}

function HeaderIconLink({
  href,
  label,
  badge,
  children,
}: {
  href: string;
  label: string;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="relative flex h-11 w-11 items-center justify-center rounded-xl text-navy transition-colors hover:bg-medical-bg hover:text-primary"
    >
      {children}
      {typeof badge === "number" && badge > 0 && (
        <span className="absolute top-1 left-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-accent-red px-1 text-[10px] font-semibold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
