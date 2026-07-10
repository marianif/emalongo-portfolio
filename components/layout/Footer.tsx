/**
 * Footer: the deepest pool of the crypt. Name, a direct contact line, and the
 * year. Quiet by design; the page ends in darkness. (Contatti has no page of
 * its own — the email links straight out.)
 */
export default function Footer({
  rights,
  email,
}: {
  rights: string;
  email: string;
}) {
  const year = "2026";
  return (
    <footer className="bg-crypt-deep px-6 py-16 sm:px-10 lg:px-16">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <p className="font-serif text-[clamp(1.5rem,4vw,2.5rem)] leading-none text-bone">
          Emanuele Longo
        </p>
        <a
          href={`mailto:${email}`}
          className="font-sans text-sm text-muted underline decoration-rule underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
        >
          {email}
        </a>
      </div>
      <p className="mt-10 font-sans text-xs text-rule">
        © {year} Emanuele Longo. {rights}.
      </p>
      <p className="mt-2 font-sans text-xs text-rule">
        Sito realizzato da Federica Mariani.
      </p>
    </footer>
  );
}
