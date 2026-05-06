import Link from "next/link";
import { Icon } from "@/components/icon";
import { Badge, EmptyVisual } from "@/components/sections/common";
import { cn } from "@/lib/utils";

export function TrackCard({
  track,
  href,
}: {
  track: {
    slug: string;
    name: string;
    icon: string;
    color: string;
    gradient: string;
    summary: string;
    exam: string;
  };
  href?: string;
}) {
  return (
    <Link
      href={href ?? `/olympiads/${track.slug}`}
      className="group card-surface block rounded-md p-5 transition hover:-translate-y-1 hover:border-emerald/30 hover:shadow-xl"
    >
      <div className="flex items-start justify-between gap-4">
        <span className={cn("flex h-14 w-14 items-center justify-center rounded-md bg-gradient-to-br", track.gradient, track.color)}>
          <Icon name={track.icon} className="h-8 w-8" />
        </span>
        <span className="rounded-full bg-mint px-3 py-1 text-xs font-black text-emerald">{track.exam}</span>
      </div>
      <h3 className="mt-4 text-xl font-black text-charcoal">{track.name}</h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-charcoal/70">{track.summary}</p>
      <div className="mt-4 flex items-center justify-end text-navy transition group-hover:text-emerald">
        <Icon name="chevron" className="h-5 w-5" />
      </div>
    </Link>
  );
}

export function Pathway({ steps }: { steps: { title: string; copy: string; icon: string }[] }) {
  return (
    <div className="rounded-none bg-mint/70 py-8">
      <div className="mx-auto grid max-w-6xl gap-5 px-4 sm:px-6 md:grid-cols-5 lg:px-8">
        {steps.map((step, index) => (
          <div key={step.title} className="relative text-center">
            {index < steps.length - 1 && <div className="absolute left-1/2 top-9 hidden h-px w-full border-t border-dashed border-emerald/35 md:block" />}
            <div className="relative mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full border border-emerald/20 bg-white text-emerald shadow-sm">
              <Icon name={step.icon} className="h-8 w-8" />
              <span className="absolute -right-1 top-7 flex h-5 w-5 items-center justify-center rounded-full bg-emerald text-[10px] font-black text-white">
                {index + 1}
              </span>
            </div>
            <h3 className="mt-4 text-sm font-black text-charcoal">{step.title}</h3>
            <p className="mt-1 text-xs leading-5 text-charcoal/70">{step.copy}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const resourceTone = {
  dark: "dark-panel text-white",
  mint: "bg-mint text-charcoal",
  cool: "bg-[#f2f5f8] text-charcoal",
  gold: "bg-[#fff5d8] text-charcoal",
  teal: "bg-[#e6f6f4] text-charcoal",
};

export function ResourceCard({
  resource,
}: {
  resource: { title: string; category: string; description: string; href: string; icon: string; tone: keyof typeof resourceTone };
}) {
  const dark = resource.tone === "dark";
  return (
    <Link href={resource.href} className={cn("group rounded-md border border-navy/10 p-5 transition hover:-translate-y-1", resourceTone[resource.tone])}>
      <Badge className={cn("mb-5", dark && "border-gold/20 bg-gold/20 text-gold")}>{resource.category}</Badge>
      <Icon name={resource.icon} className={cn("h-8 w-8", dark ? "text-gold" : "text-emerald")} />
      <h3 className={cn("mt-4 text-lg font-black", dark ? "text-white" : "text-charcoal")}>{resource.title}</h3>
      <p className={cn("mt-2 min-h-16 text-sm leading-6", dark ? "text-white/75" : "text-charcoal/70")}>{resource.description}</p>
      <div className={cn("mt-5 flex justify-end", dark ? "text-gold" : "text-emerald")}>
        <Icon name="chevron" className="h-5 w-5 transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export function GuidePreviewCard({
  guide,
}: {
  guide: { slug: string; title: string; category: string; description: string; readTime: string; level: string };
}) {
  return (
    <Link href={`/guides/${guide.slug}`} className="card-surface group overflow-hidden rounded-md transition hover:-translate-y-1">
      <EmptyVisual title={guide.title} icon={guide.category === "Chemistry" ? "flask" : guide.category === "Informatics" ? "code" : "book-open"} />
      <div className="p-4">
        <Badge>{guide.category}</Badge>
        <h3 className="mt-3 text-lg font-black text-charcoal">{guide.title}</h3>
        <p className="mt-2 min-h-14 text-sm leading-6 text-charcoal/70">{guide.description}</p>
        <div className="mt-4 flex items-center justify-between text-xs font-bold text-charcoal/60">
          <span>{guide.readTime}</span>
          <span>{guide.level}</span>
          <Icon name="bookmark" className="h-4 w-4 text-emerald" />
        </div>
      </div>
    </Link>
  );
}

export function BlogCard({
  post,
}: {
  post: { slug: string; title: string; category: string; excerpt: string; date: string; author: string; read: string };
}) {
  return (
    <Link href={`/blog/${post.slug}`} className="card-surface group grid overflow-hidden rounded-md transition hover:-translate-y-1 sm:grid-cols-[160px_1fr]">
      <EmptyVisual title={post.title} icon={post.category === "Astronomy" ? "orbit" : post.category === "Chemistry" ? "flask" : "atom"} />
      <div className="p-4">
        <Badge>{post.category}</Badge>
        <h3 className="mt-3 text-base font-black text-charcoal">{post.title}</h3>
        <p className="mt-2 text-sm leading-6 text-charcoal/70">{post.excerpt}</p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-charcoal/60">
          <span>{post.date}</span>
          <span>{post.author}</span>
          <span>{post.read}</span>
        </div>
      </div>
    </Link>
  );
}

export function AlumniCard({
  story,
}: {
  story: { name: string; achievement: string; subject: string; location: string; quote: string; role: string };
}) {
  return (
    <article className="card-surface rounded-md p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-mint to-gold text-xl font-black text-navy">
          {story.name
            .split(" ")
            .map((part) => part[0])
            .join("")}
        </div>
        <div>
          <Badge>{story.achievement}</Badge>
          <h3 className="mt-2 font-black text-charcoal">{story.name}</h3>
          <p className="text-sm font-semibold text-charcoal/70">{story.subject}</p>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-sm text-charcoal/70">
        <p className="flex items-center gap-2">
          <Icon name="medal" className="h-4 w-4 text-emerald" />
          {story.role}
        </p>
        <p className="flex items-center gap-2">
          <Icon name="flag" className="h-4 w-4 text-emerald" />
          {story.location}
        </p>
      </div>
      <p className="mt-4 text-sm font-medium leading-6 text-charcoal">{`"${story.quote}"`}</p>
      <Link href="#" className="mt-4 inline-flex items-center gap-2 text-sm font-black text-emerald">
        Read more <Icon name="chevron" className="h-4 w-4" />
      </Link>
    </article>
  );
}
