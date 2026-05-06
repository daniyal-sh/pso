import Link from "next/link";
import { Icon } from "@/components/icon";
import { ScienceMural } from "@/components/sections/science-mural";
import { cn } from "@/lib/utils";

export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border border-emerald/15 bg-mint px-3 py-1 text-xs font-bold text-emerald", className)}>
      {children}
    </span>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  icon = "chevron",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline" | "light";
  icon?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-black transition",
        variant === "primary" && "bg-emerald text-white shadow-lg shadow-emerald/20 hover:bg-teal",
        variant === "outline" && "border border-white/25 bg-white/5 text-white hover:border-gold/50 hover:text-gold",
        variant === "light" && "border border-emerald/20 bg-white text-emerald hover:bg-mint",
        className,
      )}
    >
      {children}
      <Icon name={icon} className="h-4 w-4" />
    </Link>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  copy,
  action,
}: {
  eyebrow?: string;
  title: string;
  copy?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-emerald">
            <span className="h-3 w-3 border-l-[10px] border-y-[6px] border-y-transparent border-l-emerald" />
            {eyebrow}
          </div>
        )}
        <h2 className="font-display text-3xl font-bold text-charcoal sm:text-4xl">{title}</h2>
        {copy && <p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal/70">{copy}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHero({
  title,
  subtitle,
  kicker,
  stats,
  variant = "compact",
  actions,
}: {
  title: string;
  subtitle: string;
  kicker?: string;
  stats?: { label: string; value: string; icon: string }[];
  variant?: "home" | "guides" | "question-bank" | "alumni" | "compact";
  actions?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      {variant === "home" ? (
        <div
          className="absolute inset-y-0 right-0 hidden w-full bg-cover bg-center opacity-80 md:block lg:w-[62%]"
          style={{ backgroundImage: "url('/generated/pakistan-olympiads-hero.png')" }}
        />
      ) : (
        <ScienceMural variant={variant} className="absolute inset-y-0 right-0 hidden w-full rounded-none opacity-70 md:block lg:w-[58%]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/92 to-navy/30" />
      <Container className="relative z-10 py-12 sm:py-16 lg:py-20">
        <div className="max-w-3xl">
          {kicker && <p className="mb-3 text-sm font-black uppercase text-gold">{kicker}</p>}
          <h1 className="font-display text-5xl font-bold leading-[0.95] text-white sm:text-6xl lg:text-7xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-white/80">{subtitle}</p>
          {actions && <div className="mt-7 flex flex-wrap gap-4">{actions}</div>}
        </div>
        {stats && (
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 border-r border-white/10 pr-4 last:border-r-0">
                <span className="flex h-10 w-10 items-center justify-center rounded-md border border-gold/25 bg-white/10 text-gold">
                  <Icon name={stat.icon} className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-2xl font-black text-white">{stat.value}</div>
                  <div className="text-xs font-semibold text-white/70">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}

export function StatStrip({ stats, className }: { stats: { label: string; value: string; icon: string }[]; className?: string }) {
  return (
    <section className={cn("dark-panel text-white", className)}>
      <Container className="grid gap-4 py-5 sm:grid-cols-2 lg:grid-cols-6">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 border-white/10 lg:border-r lg:last:border-r-0">
            <Icon name={stat.icon} className="h-7 w-7 text-gold" />
            <div>
              <div className="text-2xl font-black leading-none text-white">{stat.value}</div>
              <div className="text-xs font-bold text-white/70">{stat.label}</div>
            </div>
          </div>
        ))}
      </Container>
    </section>
  );
}

export function EmptyVisual({ icon = "sparkles", title }: { icon?: string; title: string }) {
  return (
    <div className="soft-grid flex aspect-[16/9] items-center justify-center rounded-t-md bg-mint text-emerald">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg">
        <Icon name={icon} className="h-10 w-10" />
      </div>
      <span className="sr-only">{title}</span>
    </div>
  );
}
