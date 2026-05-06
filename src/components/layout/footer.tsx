import Link from "next/link";
import { Icon } from "@/components/icon";
import { Logo } from "@/components/layout/logo";

const columns = [
  {
    title: "Explore",
    links: ["Olympiads", "Guides", "Question Bank", "Past Papers", "Blog", "Alumni"],
  },
  {
    title: "Resources",
    links: ["MCQ Practice", "Long Problems", "Roadmaps", "Glossary", "Formula Sheet", "Recommended Books"],
  },
  {
    title: "Community",
    links: ["Leaderboard", "Contributors", "Events", "Study Groups", "Our Team"],
  },
];

export function Footer() {
  return (
    <footer className="dark-panel science-field mt-auto text-white">
      <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_2fr_1.2fr] lg:px-8">
        <div>
          <Logo />
          <p className="mt-5 max-w-xs text-sm leading-6 text-white/70">
            A community-run platform dedicated to helping Pakistani students excel in science olympiads.
          </p>
          <div className="mt-5 flex gap-2">
            {["users", "book-open", "trophy", "sparkles"].map((icon) => (
              <span key={icon} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80">
                <Icon name={icon} className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-bold text-white">{column.title}</h3>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                {column.links.map((link) => (
                  <li key={link}>
                    <Link href="#" className="transition hover:text-gold">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Stay Updated</h3>
          <p className="mt-3 text-sm leading-6 text-white/70">Get the latest resources, blog posts, and announcements.</p>
          <form className="mt-4 flex overflow-hidden rounded-md border border-white/10 bg-white/5">
            <input
              aria-label="Email address"
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/45 outline-none"
              placeholder="Enter your email"
              type="email"
            />
            <button className="bg-emerald px-4 text-sm font-bold text-white" type="button">
              Subscribe
            </button>
          </form>
        </div>
      </div>
      <div className="relative z-10 border-t border-white/10 px-4 py-5 text-xs text-white/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>2026 Pakistan Olympiads. All rights reserved.</span>
          <div className="flex gap-5">
            <Link href="#">Privacy Policy</Link>
            <Link href="#">Terms of Use</Link>
            <Link href="#">Contact Us</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
