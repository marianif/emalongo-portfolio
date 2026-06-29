import { NextResponse, type NextRequest } from "next/server";
import {
  CATEGORIES,
  getAllArtworks,
  getArtworksByCategory,
  getFeaturedArtworks,
  type Category,
} from "@/lib/cloudinary";

/**
 * GET /api/artworks
 *   ?category=dipinti|disegni|opere-digitali  — scope to one category
 *   ?featured=true                            — only home-page featured works
 *
 * Returns the curated artwork collection fetched live from Cloudinary, mapped
 * to the same `Artwork` shape the UI already consumes. Dynamic (the handler
 * hits the Cloudinary Admin API), but the data layer memoises per process so
 * repeated requests don't re-hit the rate-limited API.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");
  const featured = searchParams.get("featured") === "true";

  try {
    if (category && !CATEGORIES.includes(category as Category)) {
      return NextResponse.json(
        { error: `Unknown category "${category}".`, categories: CATEGORIES },
        { status: 400 },
      );
    }

    let artworks = category
      ? await getArtworksByCategory(category as Category)
      : await getAllArtworks();

    if (featured) {
      artworks = category
        ? artworks.filter((w) => w.featured)
        : await getFeaturedArtworks();
    }

    return NextResponse.json({ count: artworks.length, artworks });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch artworks from Cloudinary.", detail: message },
      { status: 502 },
    );
  }
}
