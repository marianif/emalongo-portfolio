import { NextResponse, type NextRequest } from "next/server";
import {
  CATEGORIES,
  getArtworksByCategory,
  type Category,
} from "@/lib/cloudinary";

/**
 * GET /api/artworks/[category]
 *   e.g. /api/artworks/dipinti
 *   ?featured=true — only featured works within the category
 *
 * Convenience path-scoped variant of /api/artworks?category=... — fetched live
 * from Cloudinary and mapped to the shared `Artwork` shape.
 */
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/artworks/[category]">,
) {
  const { category } = await ctx.params;
  const featured = request.nextUrl.searchParams.get("featured") === "true";

  if (!CATEGORIES.includes(category as Category)) {
    return NextResponse.json(
      { error: `Unknown category "${category}".`, categories: CATEGORIES },
      { status: 404 },
    );
  }

  try {
    let artworks = await getArtworksByCategory(category as Category);
    if (featured) artworks = artworks.filter((w) => w.featured);

    return NextResponse.json({ category, count: artworks.length, artworks });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch artworks from Cloudinary.", detail: message },
      { status: 502 },
    );
  }
}
