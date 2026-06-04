import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale, LOCALES } from "../../dictionaries";
import {
  getAllArtworks,
  getArtworkBySlug,
  getArtworkNeighbors,
} from "@/lib/artworks";
import PageTransition from "@/components/motion/PageTransition";
import ArtworkViewer from "@/components/gallery/ArtworkViewer";

export function generateStaticParams() {
  return LOCALES.flatMap((lang) =>
    getAllArtworks().map((w) => ({ lang, slug: w.slug })),
  );
}

export default async function ArtworkPage({
  params,
}: PageProps<"/[lang]/opere/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const artwork = getArtworkBySlug(slug);
  if (!artwork) notFound();

  const resolveTitle = (w: { title: string; titleEn?: string }) =>
    lang === "en" && w.titleEn ? w.titleEn : w.title || dict.artwork.untitled;

  const title = resolveTitle(artwork);

  // Only the fields that actually parsed out of the filename get a row; the
  // caption never shows an empty label or a dangling separator. Category is
  // always known, and grounds the work in its body of work.
  const meta = [
    artwork.technique && {
      label: dict.artwork.technique,
      value: artwork.technique,
    },
    artwork.dimensions && {
      label: dict.artwork.dimensions,
      value: artwork.dimensions,
    },
    artwork.year && { label: dict.artwork.year, value: artwork.year },
    {
      label: dict.artwork.category,
      value: dict.categories[artwork.category],
    },
  ].filter((m): m is { label: string; value: string } => Boolean(m));

  const { prev, next } = getArtworkNeighbors(slug);

  return (
    <PageTransition>
      <article className="bg-crypt px-6 pt-24 pb-24 sm:pt-28 sm:pb-32">
        <div className="mx-auto max-w-5xl">
          {/* The way back to the wall: a single quiet line at the column's
              top-left, clear of the work below it. Kept compact so it costs the
              artwork almost no vertical room. */}
          <Link
            href={`/${lang}/opere`}
            data-cursor="view"
            className="group/back inline-flex items-center font-sans text-[0.8125rem] tracking-[0.01em] text-muted outline-none transition-colors duration-[240ms] ease-[var(--ease-exit)] hover:text-ember focus-visible:text-ember"
          >
            <span className="mr-2 transition-transform duration-[240ms] ease-[var(--ease-exit)] group-hover/back:-translate-x-1">
              ←
            </span>
            {dict.artwork.back}
          </Link>

          <div className="mt-6 sm:mt-7">
            <ArtworkViewer
              artwork={artwork}
              lang={lang}
              title={title}
              meta={meta}
              prev={prev && { slug: prev.slug, title: resolveTitle(prev) }}
              next={next && { slug: next.slug, title: resolveTitle(next) }}
              labels={{ prev: dict.artwork.prev, next: dict.artwork.next }}
            />
          </div>
        </div>
      </article>
    </PageTransition>
  );
}
