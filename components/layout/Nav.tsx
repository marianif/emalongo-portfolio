"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/app/[lang]/dictionaries";

type NavLabels = {
  home: string;
  opere: string;
  bio: string;
  visione: string;
  contatti: string;
};

/**
 * Site navigation + language toggle. Fixed, transparent over the crypt; the
 * active route shifts to ember (a sanctioned use of the scarce accent), and the
 * language toggle's active side is ember too. No hamburger: five destinations
 * collapse to a quiet wrapping row on small screens, never a hidden drawer.
 */
export default function Nav({
  lang,
  labels,
}: {
  lang: Locale;
  labels: NavLabels;
}) {
  const pathname = usePathname();
  const otherLang: Locale = lang === "it" ? "en" : "it";
  const switchHref = pathname.replace(/^\/(it|en)/, `/${otherLang}`) || `/${otherLang}`;

  const items = [
    { href: `/${lang}`, label: labels.home, exact: true },
    { href: `/${lang}/opere`, label: labels.opere, exact: false },
    { href: `/${lang}/bio`, label: labels.bio, exact: false },
    { href: `/${lang}/visione`, label: labels.visione, exact: false },
    { href: `/${lang}/contatti`, label: labels.contatti, exact: false },
  ];

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-4 px-6 py-5 sm:px-10 lg:px-16">
      <Link
        href={`/${lang}`}
        className="font-serif text-base tracking-tight text-bone transition-colors hover:text-accent"
      >
        E. Longo
      </Link>

      <div className="flex items-center gap-x-4 gap-y-1">
        <ul className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
          {items.slice(1).map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(item.href, item.exact) ? "page" : undefined}
                className={`font-sans text-[0.8125rem] tracking-[0.01em] transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-bone ${
                  isActive(item.href, item.exact) ? "text-accent" : "text-muted"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Language toggle: active side is ember. */}
        <div className="flex items-center gap-1.5 font-sans text-[0.8125rem]">
          <span className="text-accent" aria-current="true">
            {lang.toUpperCase()}
          </span>
          <span className="text-rule" aria-hidden>
            /
          </span>
          <Link
            href={switchHref}
            className="text-muted transition-colors hover:text-bone"
            aria-label={`Switch to ${otherLang === "it" ? "Italiano" : "English"}`}
          >
            {otherLang.toUpperCase()}
          </Link>
        </div>
      </div>
    </nav>
  );
}
