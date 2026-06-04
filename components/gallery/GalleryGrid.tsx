import type { Artwork } from "@/lib/artworks";
import type { Locale } from "@/app/[lang]/dictionaries";
import ArtworkCard from "./ArtworkCard";

/** Scaffold grid. Plain CSS grid placeholder; real layout via the flow plugin. */
export default function GalleryGrid({
  artworks,
  lang,
}: {
  artworks: Artwork[];
  lang: Locale;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 p-6 md:grid-cols-4">
      {artworks.map((artwork) => (
        <ArtworkCard key={artwork.slug} artwork={artwork} lang={lang} />
      ))}
    </div>
  );
}
