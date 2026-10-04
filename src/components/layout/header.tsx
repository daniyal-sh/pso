"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/layout/logo";
import { navItems } from "@/lib/data";
import { cn } from "@/lib/utils";

function isActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy/95 text-white shadow-[0_8px_30px_rgba(11,21,32,0.18)] backdrop-blur">
      <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center gap-5 px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav aria-label="Main" className="hidden flex-1 justify-center gap-1 lg:flex">
          {navItems.map((item) => {
            const active = isActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
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
        <div className="ml-auto" />
      </div>
      <nav aria-label="Main mobile" className="no-scrollbar flex max-w-full gap-2 overflow-x-auto border-t border-white/10 px-4 py-2 lg:hidden">
        {navItems.map((item) => {
          const active = isActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/80",
                active && "border-emerald/60 bg-emerald/20 text-white",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
