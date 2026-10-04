"use client";

import { useEffect } from "react";
import { Container } from "@/components/sections/common";

export default function SiteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-black uppercase text-emerald">Something went wrong</p>
          <h1 className="mt-3 font-display text-5xl font-bold text-charcoal">This page could not load</h1>
          <p className="mt-4 text-base leading-7 text-charcoal/70">Please try again. If the problem continues, check back in a few minutes.</p>
          <button type="button" onClick={() => retry()} className="mt-8 rounded-md bg-emerald px-5 py-3 text-sm font-black text-white hover:bg-teal">
            Try again
          </button>
        </div>
      </Container>
    </section>
  );
}
