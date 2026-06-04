import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "./dictionaries";
import {
  CATEGORIES,
  getArtworksByCategory,
  getFeaturedRest,
  getHeroArtwork,
} from "@/lib/artworks";
import PageTransition from "@/components/motion/PageTransition";
import HomeHero from "@/components/home/HomeHero";
import FeaturedWork from "@/components/home/FeaturedWork";
import VoiceFragment from "@/components/home/VoiceFragment";
import ManifestoRupture from "@/components/home/ManifestoRupture";
import BodiesOfWork from "@/components/home/BodiesOfWork";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  const hero = getHeroArtwork();
  const featured = getFeaturedRest();
  const fragments = dict.home.fragments;

  // One representative cover per body of work for the gateways.
  const gateways = CATEGORIES.map((category) => ({
    category,
    label: dict.categories[category],
    cover: getArtworksByCategory(category)[0],
  }));

  const heroTitle =
    hero && lang === "en" && hero.titleEn ? hero.titleEn : hero?.title;

  return (
    <PageTransition>
      {hero && (
        <HomeHero
          artwork={hero}
          name="Emanuele Longo"
          role={dict.home.heroRole}
          tagline={dict.home.tagline}
          scrollCue={dict.home.scrollCue}
          altText={`${heroTitle}, ${hero.year ?? ""} — ${dict.home.tagline}`}
        />
      )}

      {/* Selected works, threaded with manifesto fragments. */}
      <section className="bg-crypt px-6 pt-[clamp(5rem,14vh,10rem)] sm:px-10 lg:px-16">
        <div className="mb-12 max-w-2xl">
          <h2 className="font-serif text-[clamp(1.6rem,3.5vw,2.6rem)] text-bone">
            {dict.home.worksTitle}
          </h2>
          <p className="mt-3 font-sans text-base text-muted">
            {dict.home.worksLead}
          </p>
        </div>

        <div className="flex flex-col gap-[clamp(4rem,10vh,8rem)]">
          {featured.map((work, i) => (
            <div key={work.slug}>
              <FeaturedWork artwork={work} lang={lang} index={i} />
              {/* Thread a fragment after the 1st and 3rd works. */}
              {(i === 0 || i === 2) && fragments[i === 0 ? 0 : 1] && (
                <VoiceFragment text={fragments[i === 0 ? 0 : 1]} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* The catalogue rupture: light ground, charged excerpt. */}
      <ManifestoRupture
        excerpt={dict.home.excerpt}
        attribution={dict.home.excerptAttribution}
        readLabel={dict.home.readVisione}
        lang={lang}
      />

      {/* A last fragment back in the crypt before the gateways. */}
      {fragments[2] && (
        <div className="bg-crypt px-6">
          <VoiceFragment text={fragments[2]} />
        </div>
      )}

      <BodiesOfWork
        title={dict.home.bodiesTitle}
        gateways={gateways}
        lang={lang}
      />
    </PageTransition>
  );
}
