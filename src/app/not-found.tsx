import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ButtonLink, Container } from "@/components/sections/common";

// Root-level so unmatched URLs and notFound() calls share one page with the site chrome.
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <Header />
      <main className="flex-1">
        <section className="py-20">
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-black uppercase text-emerald">404</p>
              <h1 className="mt-3 font-display text-5xl font-bold text-charcoal">Page not found</h1>
              <p className="mt-4 text-base leading-7 text-charcoal/70">The page you are looking for has moved or no longer exists.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <ButtonLink href="/" icon="rocket">
                  Go home
                </ButtonLink>
                <ButtonLink href="/question-bank" variant="light">
                  Question bank
                </ButtonLink>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}
