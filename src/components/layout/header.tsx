"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icon";
import { Logo } from "@/components/layout/logo";
import { navItems } from "@/lib/data";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy/95 text-white shadow-[0_8px_30px_rgba(11,21,32,0.18)] backdrop-blur">
      <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center gap-5 px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden flex-1 justify-center gap-1 lg:flex">
          {navItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white",
                  active && "bg-emerald/20 text-white shadow-[inset_0_-2px_0_#0f6b4f]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/80 transition hover:border-gold/50 hover:text-gold sm:flex"
            aria-label="Search"
            type="button"
          >
            <Icon name="search" className="h-5 w-5" />
          </button>
          <button
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-white/10 text-gold transition hover:border-gold/50 sm:flex"
            aria-label="Toggle theme"
            type="button"
          >
            <Icon name="sun" className="h-5 w-5" />
          </button>
          <Link
            href="/guides/ioaa-pakistan-guide"
            className="rounded-md bg-emerald px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald/20 transition hover:bg-teal"
          >
            IOAA Guide
          </Link>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto border-t border-white/10 px-4 py-2 lg:hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/80"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
