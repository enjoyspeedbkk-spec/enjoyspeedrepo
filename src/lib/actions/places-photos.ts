"use server";

// Google Places (New) API — fetch venue photos for the Skylane bike lane
// Docs: https://developers.google.com/maps/documentation/places/web-service/place-photos

const SKYLANE_PLACE_QUERY = "Skylane Happy Healthy Bike Lane Suvarnabhumi";
const MAX_PHOTOS = 8;
const PHOTO_HEIGHT = 800; // max height in pixels

// Cache photos in memory for 1 hour (server-side module-level cache)
let cachedPhotos: string[] | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Fetch place photos from Google Places (New) API.
 * 1. Text Search to find place ID
 * 2. Place Details to get photo references
 * 3. Build photo media URLs
 *
 * Returns an array of photo URLs, or empty array if API is unavailable.
 */
export async function getSkylanePhotos(): Promise<string[]> {
  // Return cached if fresh
  if (cachedPhotos && Date.now() < cacheExpiry) {
    return cachedPhotos;
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_MAPS_API_KEY not set — skipping Places photos");
    return [];
  }

  try {
    // Step 1: Text Search to find the place
    const searchRes = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.id,places.photos",
        },
        body: JSON.stringify({
          textQuery: SKYLANE_PLACE_QUERY,
          maxResultCount: 1,
        }),
        next: { revalidate: 3600 }, // ISR: revalidate every hour
      }
    );

    if (!searchRes.ok) {
      console.error("Places text search failed:", searchRes.status, await searchRes.text());
      return [];
    }

    const searchData = await searchRes.json();
    const place = searchData.places?.[0];

    if (!place?.photos?.length) {
      console.warn("No photos found for Skylane place");
      return [];
    }

    // Step 2: Build photo media URLs from photo references
    // Each photo has a `name` like "places/PLACE_ID/photos/PHOTO_REF"
    const photos: string[] = place.photos
      .slice(0, MAX_PHOTOS)
      .map((photo: { name: string }) => {
        return `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=${PHOTO_HEIGHT}&key=${apiKey}`;
      });

    // Cache the result
    cachedPhotos = photos;
    cacheExpiry = Date.now() + CACHE_TTL;

    return photos;
  } catch (err) {
    console.error("Failed to fetch Skylane photos:", err);
    return [];
  }
}
