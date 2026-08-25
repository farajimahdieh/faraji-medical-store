import Link from "next/link";
import { Logo } from "@/components/icons/Logo";
import { Container } from "@/components/ui/Container";
import { mainNavLinks } from "@/data/navigation";
import { WishlistHeaderLink } from "@/components/wishlist/WishlistHeaderLink";
import { ProfilePopover } from "./ProfilePopover";
import { CartPopover } from "./CartPopover";
import { MegaMenu } from "./MegaMenu";
import { MobileMenu } from "./MobileMenu";
import { SearchBar } from "./SearchBar";

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
          <ProfilePopover />
          <WishlistHeaderLink />
          <CartPopover />
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
