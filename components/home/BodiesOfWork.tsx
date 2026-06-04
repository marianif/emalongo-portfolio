import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/motion/Reveal";
import { getImageSrc } from "@/lib/images";
import type { Artwork, Category } from "@/lib/artworks";
import type { Locale } from "@/app/[lang]/dictionaries";

type Gateway = { category: Category; label: string; cover?: Artwork };

/**
 * Three gateways into the catalogue: dipinti / disegni / opere digitali. Each
 * is a tall portal with a representative work behind a category title; clicking
 * routes into /opere filtered to that body. Not a uniform card grid: the labels
 * are large serif, the covers darken at rest and clear on hover.
 */
export default function BodiesOfWork({
  title,
  gateways,
  lang,
}: {
  title: string;
  gateways: Gateway[];
  lang: Locale;
}) {
  return (
    <section className="bg-crypt px-6 py-[clamp(5rem,14vh,10rem)] sm:px-10 lg:px-16">
      <Reveal>
        <h2 className="mb-10 font-serif text-[clamp(1.6rem,3.5vw,2.6rem)] text-bone">
          {title}
        </h2>
      </Reveal>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {gateways.map((g, i) => (
          <Reveal key={g.category} delay={i * 0.08}>
            <Link
              href={`/${lang}/opere?categoria=${g.category}`}
              className="group relative flex aspect-[3/4] items-end overflow-hidden bg-crypt-raise outline-none md:aspect-[3/5]"
            >
              {g.cover && (
                <Image
                  src={getImageSrc(g.cover.src, { width: 900 })}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-[filter,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] [filter:brightness(0.55)] group-hover:[filter:brightness(0.8)] group-hover:scale-[1.02] group-focus-visible:[filter:brightness(0.8)]"
                />
              )}
              <span
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(13,11,8,0.85) 0%, transparent 55%)",
                }}
              />
              <h3 className="relative z-10 p-6 font-serif text-[clamp(1.4rem,2.5vw,2rem)] text-bone transition-colors duration-500 group-hover:text-accent group-focus-visible:text-accent">
                {g.label}
              </h3>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
