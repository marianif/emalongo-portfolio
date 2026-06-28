import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCALES = ["it", "en"] as const;
const DEFAULT_LOCALE = "it";

/** Pick a supported locale from the Accept-Language header, else default. */
function getLocale(request: NextRequest): string {
  const header = request.headers.get("accept-language");
  if (!header) return DEFAULT_LOCALE;

  const preferred = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of preferred) {
    if ((LOCALES as readonly string[]).includes(tag)) return tag;
  }
  return DEFAULT_LOCALE;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) return;

  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Run on everything except Next internals, API, and static assets. The final
  // alternative skips any path whose last segment has a file extension (e.g.
  // /artist-photo.jpg, /Mostre.docx) so public-root files are served directly
  // and never locale-redirected — otherwise the image optimizer's internal
  // fetch of such a file gets a 307 and reports "isn't a valid image".
  matcher: [
    "/((?!_next/static|_next/image|api|favicon.ico|artworks|.*\\.[^/]+$).*)",
  ],
};
