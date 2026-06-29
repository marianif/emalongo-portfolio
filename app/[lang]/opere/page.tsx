import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import { CATEGORIES, getAllArtworks, type Category } from "@/lib/artworks";
import GalleryClient, {
  type GalleryLabels,
} from "@/components/gallery/GalleryClient";
import BackToTop from "@/components/gallery/BackToTop";
import PageTransition from "@/components/motion/PageTransition";

function isCategory(value: string | undefined): value is Category {
  return !!value && (CATEGORIES as string[]).includes(value);
}

/**
 * The salon wall. The page is one static document: it ships the full
 * collection once, and filtering happens client-side (GalleryClient). The
 * `?categoria=` param is read only to seed the initial filter, so a menu
 * deep-link or a shared URL lands pre-filtered.
 */
export default async function OperePage({
  params,
  searchParams,
}: PageProps<"/[lang]/opere">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  const { categoria } = await searchParams;
  const raw = Array.isArray(categoria) ? categoria[0] : categoria;
  const initial = isCategory(raw) ? raw : "all";

  const artworks = await getAllArtworks();

  const labels: GalleryLabels = {
    title: dict.opere.title,
    all: dict.opere.all,
    categories: dict.categories,
    works: dict.opere.works,
  };

  return (
    <PageTransition>
      <section className="bg-crypt">
        <GalleryClient
          artworks={artworks}
          lang={lang}
          initial={initial}
          labels={labels}
        />
        <BackToTop label={dict.opere.backToTop} />
      </section>
    </PageTransition>
  );
}
