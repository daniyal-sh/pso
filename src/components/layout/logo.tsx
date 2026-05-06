import Link from "next/link";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-3", className)} aria-label="Pakistan Olympiads home">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-emerald shadow-sm">
        <Icon name="moonstar" className="h-7 w-7" strokeWidth={2.4} />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-sm font-black uppercase text-white">Pakistan</span>
          <span className="block text-sm font-black uppercase text-white">Olympiads</span>
        </span>
      )}
    </Link>
  );
}
