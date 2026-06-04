import Image from "next/image";
import Link from "next/link";
import type { Artwork } from "@/lib/artworks";
import { getImageSrc } from "@/lib/images";
import type { Locale } from "@/app/[lang]/dictionaries";

/**
 * Scaffold artwork tile. `fill` + a wrapper because source scans have varied,
 * unknown aspect ratios. Real layout/motion via the flow plugin.
 */
export default function ArtworkCard({
  artwork,
  lang,
}: {
  artwork: Artwork;
  lang: Locale;
}) {
  const title =
    lang === "en" && artwork.titleEn ? artwork.titleEn : artwork.title;

  return (
    <Link href={`/${lang}/opere/${artwork.slug}`} className="block">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-900">
        <Image
          src={getImageSrc(artwork.src, { width: 800 })}
          alt={title}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover"
        />
      </div>
      <p className="mt-2 text-sm">{title}</p>
    </Link>
  );
}
