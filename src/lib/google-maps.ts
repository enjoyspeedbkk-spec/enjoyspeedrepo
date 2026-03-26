// ========================================
// EN-JOY SPEED — Google Maps Static API
// Generates map images for the Skylane venue
// ========================================

// Skylane (Happy and Healthy Bike Lane) — Suvarnabhumi
const SKYLANE_CENTER = "13.6814,100.7472";
const SKYLANE_MARKER = "13.6814,100.7472";

interface StaticMapOptions {
  /** Map type: roadmap, satellite, terrain, hybrid */
  maptype?: "roadmap" | "satellite" | "terrain" | "hybrid";
  /** Zoom level (1-20) */
  zoom?: number;
  /** Image width in px (max 640 for free tier) */
  width?: number;
  /** Image height in px (max 640 for free tier) */
  height?: number;
  /** Custom center (defaults to Skylane) */
  center?: string;
  /** Whether to add a marker pin */
  showMarker?: boolean;
  /** Map scale (1 or 2 for retina) */
  scale?: 1 | 2;
  /** Map language */
  language?: "en" | "th";
}

/**
 * Builds a Google Maps Static API URL for the Skylane venue.
 * Returns null if no API key is configured.
 */
export function getSkylaneMapUrl(options: StaticMapOptions = {}): string | null {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  const {
    maptype = "roadmap",
    zoom = 15,
    width = 640,
    height = 480,
    center = SKYLANE_CENTER,
    showMarker = true,
    scale = 2,
    language = "en",
  } = options;

  const params = new URLSearchParams({
    center,
    zoom: String(zoom),
    size: `${width}x${height}`,
    scale: String(scale),
    maptype,
    language,
    key: apiKey,
  });

  if (showMarker) {
    params.append("markers", `color:red|${SKYLANE_MARKER}`);
  }

  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

/**
 * Returns a set of pre-configured map URLs for the About page.
 * Satellite overview + road map with marker.
 */
export function getVenueMapUrls(locale: "en" | "th" = "en") {
  return {
    satellite: getSkylaneMapUrl({
      maptype: "hybrid",
      zoom: 16,
      width: 640,
      height: 480,
      scale: 2,
      language: locale,
    }),
    roadmap: getSkylaneMapUrl({
      maptype: "roadmap",
      zoom: 14,
      width: 640,
      height: 400,
      scale: 2,
      showMarker: true,
      language: locale,
    }),
  };
}
