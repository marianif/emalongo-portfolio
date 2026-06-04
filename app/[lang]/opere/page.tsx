import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import {
  CATEGORIES,
  getAllArtworks,
  getArtworksByCategory,
  type Category,
} from "@/lib/artworks";
import GalleryGrid from "@/components/gallery/GalleryGrid";
import PageTransition from "@/components/motion/PageTransition";

function isCategory(value: string | undefined): value is Category {
  return !!value && (CATEGORIES as string[]).includes(value);
}

export default async function OperePage({
  params,
  searchParams,
}: PageProps<"/[lang]/opere">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  const { categoria } = await searchParams;
  const active = Array.isArray(categoria) ? categoria[0] : categoria;
  const artworks = isCategory(active)
    ? getArtworksByCategory(active)
    : getAllArtworks();

  return (
    <PageTransition>
      <section className="bg-crypt pt-24 sm:pt-28">
        <header className="p-6">
          <h1>{dict.opere.title}</h1>
          <nav className="flex gap-4">
            <Link href={`/${lang}/opere`}>{dict.opere.all}</Link>
            {CATEGORIES.map((cat) => (
              <Link key={cat} href={`/${lang}/opere?categoria=${cat}`}>
                {dict.categories[cat]}
              </Link>
            ))}
          </nav>
        </header>
        <GalleryGrid artworks={artworks} lang={lang} />
      </section>
    </PageTransition>
  );
}
