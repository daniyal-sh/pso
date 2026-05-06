import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

type MuralVariant = "home" | "guides" | "question-bank" | "alumni" | "compact";

const formulas = ["E = mc^2", "ih dpsi/dt = Hpsi", "V - E = 2", "opp / hyp", "a = dv/dt"];

export function ScienceMural({ variant = "home", className }: { variant?: MuralVariant; className?: string }) {
  const isCommunity = variant === "alumni";
  const isGuide = variant === "guides";

  return (
    <div className={cn("relative min-h-[260px] overflow-hidden rounded-md", className)} aria-hidden>
      <div className="science-field absolute inset-0 dark-panel" />
      <div className="absolute right-6 top-8 h-40 w-40 rounded-full border-[18px] border-gold/70 shadow-[0_0_60px_rgba(244,194,74,0.25)]" />
      <div className="absolute right-0 top-2 h-52 w-52 rounded-full bg-navy" />
      <div className="absolute bottom-3 left-10 right-8 h-px bg-gold/30" />

      <div className="absolute left-8 top-8 grid grid-cols-2 gap-3 text-gold/75">
        {["atom", "orbit", "flask", "dna"].map((icon) => (
          <span key={icon} className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/25 bg-white/10">
            <Icon name={icon} className="h-6 w-6" />
          </span>
        ))}
      </div>

      <div className="absolute left-20 top-36 hidden rounded-full border border-teal/50 px-4 py-2 text-xs font-semibold text-mint md:block">
        Pakistan science network
      </div>

      <div className="absolute right-12 top-10 grid gap-2 text-right font-mono text-sm text-gold/70">
        {formulas.slice(0, isGuide ? 3 : 5).map((formula) => (
          <span key={formula}>{formula}</span>
        ))}
      </div>

      <div className="absolute bottom-8 right-12 flex items-end gap-3">
        {(isCommunity ? ["A", "F", "H", "Z", "M"] : ["A", "S", "H"]).map((initial, index) => (
          <div key={initial} className="flex flex-col items-center">
            <div
              className={cn(
                "flex items-center justify-center rounded-full border-2 border-white/50 bg-gradient-to-br from-mint to-gold text-sm font-black text-navy shadow-xl",
                index === 1 ? "h-16 w-16" : "h-12 w-12",
              )}
            >
              {initial}
            </div>
            <div className={cn("mt-1 rounded-t-3xl bg-emerald", index === 1 ? "h-14 w-20" : "h-10 w-16")} />
          </div>
        ))}
      </div>

      <div className="absolute bottom-10 left-36 hidden items-end gap-4 lg:flex">
        <div className="h-16 w-24 rounded-md border border-gold/40 bg-white/10 p-2">
          <div className="h-2 w-14 rounded-full bg-gold/60" />
          <div className="mt-3 h-2 w-20 rounded-full bg-mint/40" />
          <div className="mt-3 h-2 w-12 rounded-full bg-teal/70" />
        </div>
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/10 text-gold">
          <Icon name={isGuide ? "book-open" : variant === "question-bank" ? "calculator" : "trophy"} className="h-9 w-9" />
        </div>
      </div>

      <div className="absolute bottom-3 right-4 text-[84px] font-black leading-none text-white/5">PK</div>
    </div>
  );
}
