import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("flex shrink-0 items-center", className)} aria-label="Pakistan Olympiads home">
      <Image
        src={compact ? "/brand/pakistan-olympiads-mark-white.png" : "/brand/pakistan-olympiads-horizontal-white.png"}
        alt="Pakistan Olympiads"
        width={compact ? 715 : 929}
        height={compact ? 715 : 190}
        priority
        className={compact ? "h-11 w-11 object-contain" : "h-12 w-auto object-contain sm:h-14"}
      />
    </Link>
  );
}
