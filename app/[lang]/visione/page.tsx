import { notFound } from "next/navigation";
import { hasLocale } from "../dictionaries";
import { getContent } from "@/lib/content";
import PageTransition from "@/components/motion/PageTransition";

export default async function VisionePage({
  params,
}: PageProps<"/[lang]/visione">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const markdown = getContent("visione", lang);

  return (
    <PageTransition>
      {/* The statement is long-form reading: catalogue (light) ground. */}
      <article
        data-ground="catalogue"
        className="min-h-screen bg-background pt-24 text-foreground sm:pt-28"
      >
        {/* Raw markdown — a renderer will be wired when crafting the screen. */}
        <pre className="whitespace-pre-wrap p-6 font-sans">{markdown}</pre>
      </article>
    </PageTransition>
  );
}
