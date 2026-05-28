import Link from "next/link";
import { Logo } from "@/components/layout/logo";

const columns = [
  {
    title: "Explore",
    links: [
      ["Olympiads", "/olympiads"],
      ["Guides", "/guides"],
      ["Question Bank", "/question-bank"],
      ["Past Papers", "/past-papers"],
      ["Blog", "/blog"],
    ],
  },
  {
    title: "Practice",
    links: [
      ["MCQ Practice", "/question-bank"],
      ["Long Problems", "/question-bank"],
      ["Roadmaps", "/guides"],
      ["Past Papers", "/past-papers"],
    ],
  },
  {
    title: "Community",
    links: [
      ["Alumni", "/alumni"],
      ["Alumni Stories", "/alumni#stories"],
    ],
  },
];

export function Footer() {
  return (
    <footer className="dark-panel science-field mt-auto text-white">
      <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_2fr] lg:px-8">
        <div>
          <Logo />
          <p className="mt-5 max-w-xs text-sm leading-6 text-white/70">
            A community-run platform dedicated to helping Pakistani students excel in science olympiads.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-bold text-white">{column.title}</h3>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                {column.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="transition hover:text-gold">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="relative z-10 border-t border-white/10 px-4 py-5 text-xs text-white/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>Pakistan Olympiads. All rights reserved.</span>
          <div className="flex gap-5">
            <Link href="/about">Privacy Policy</Link>
            <Link href="/about">Terms of Use</Link>
            <Link href="/about">Contact Us</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
