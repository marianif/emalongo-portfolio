import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import PageTransition from "@/components/motion/PageTransition";

export default async function ContattiPage({
  params,
}: PageProps<"/[lang]/contatti">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <PageTransition>
      <section className="bg-crypt p-6 pt-24 sm:pt-28">
        <h1>{dict.nav.contatti}</h1>
        {/* Contact details TBD — email / Instagram / representation. */}
        <p data-scaffold>Contact details to be added.</p>
      </section>
    </PageTransition>
  );
}
