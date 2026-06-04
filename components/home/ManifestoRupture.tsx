import Link from "next/link";
import Reveal from "@/components/motion/Reveal";
import type { Locale } from "@/app/[lang]/dictionaries";

/**
 * The one catalogue rupture: the page steps out of the crypt into bone-paper
 * light for a single charged passage of the statement. The felt crypt to
 * catalogue transition (the Two-Worlds Rule). Ground is set by data-ground,
 * never an inline ternary.
 */
export default function ManifestoRupture({
  excerpt,
  attribution,
  readLabel,
  lang,
}: {
  excerpt: string;
  attribution: string;
  readLabel: string;
  lang: Locale;
}) {
  return (
    <section
      data-ground="catalogue"
      className="bg-background text-foreground"
      aria-label={attribution}
    >
      <div className="mx-auto max-w-4xl px-6 py-[clamp(6rem,18vh,12rem)] sm:px-10">
        <Reveal>
          <blockquote className="font-serif text-[clamp(1.8rem,4.5vw,3.4rem)] leading-[1.12] tracking-[-0.01em] text-ink">
            {excerpt}
          </blockquote>
        </Reveal>
        <Reveal delay={0.1}>
          <footer className="mt-8 flex flex-wrap items-baseline justify-between gap-4">
            <cite className="font-sans text-sm text-[color:var(--muted)] not-italic">
              {attribution}
            </cite>
            <Link
              href={`/${lang}/visione`}
              className="group inline-flex items-center gap-2 font-sans text-sm text-ink underline decoration-rule decoration-1 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
            >
              {readLabel}
              <span
                aria-hidden
                className="transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </footer>
        </Reveal>
      </div>
    </section>
  );
}
