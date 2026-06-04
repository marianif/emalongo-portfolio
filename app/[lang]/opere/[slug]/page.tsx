import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale, LOCALES } from "../../dictionaries";
import { getAllArtworks, getArtworkBySlug } from "@/lib/artworks";
import { getImageSrc } from "@/lib/images";
import PageTransition from "@/components/motion/PageTransition";

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

  const title =
    lang === "en" && artwork.titleEn ? artwork.titleEn : artwork.title;

  return (
    <PageTransition>
      <article className="bg-crypt p-6 pt-24 sm:pt-28">
        <Link href={`/${lang}/opere`}>← {dict.artwork.back}</Link>
        <div className="relative my-6 aspect-[3/4] w-full max-w-3xl bg-neutral-900">
          <Image
            src={getImageSrc(artwork.src, { width: 1600 })}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-contain"
            priority
          />
        </div>
        <h1>{title}</h1>
        <dl>
          {artwork.technique && (
            <>
              <dt>{dict.artwork.technique}</dt>
              <dd>{artwork.technique}</dd>
            </>
          )}
          {artwork.dimensions && (
            <>
              <dt>{dict.artwork.dimensions}</dt>
              <dd>{artwork.dimensions}</dd>
            </>
          )}
          {artwork.year && (
            <>
              <dt>{dict.artwork.year}</dt>
              <dd>{artwork.year}</dd>
            </>
          )}
        </dl>
      </article>
    </PageTransition>
  );
}
