"use client";

import { createContext, useContext, ReactNode } from "react";
import Image from "next/image";

/* ─── Types ───────────────────────────────────────────── */

export interface SiteImageData {
  url: string;
  objectPosition?: string;
  brightness?: number;
  contrast?: number;
  saturate?: number;
}

/** Map of image_key → full settings (url + position + filters) */
type SiteImageMap = Record<string, SiteImageData>;

/**
 * Legacy format: image_key → url string.
 * Kept for backwards-compatibility with the homepage loader.
 */
type LegacySiteImageMap = Record<string, string>;

/* ─── Context ─────────────────────────────────────────── */

const SiteImagesContext = createContext<SiteImageMap>({});

/**
 * Accepts either the new rich format or the legacy URL-only format.
 * If a value is a plain string, it gets wrapped into { url: string }.
 */
export function SiteImagesProvider({
  images,
  children,
}: {
  images: SiteImageMap | LegacySiteImageMap;
  children: ReactNode;
}) {
  // Normalise: if values are strings, wrap them
  const normalised: SiteImageMap = {};
  for (const [key, val] of Object.entries(images)) {
    normalised[key] =
      typeof val === "string" ? { url: val } : (val as SiteImageData);
  }

  return (
    <SiteImagesContext.Provider value={normalised}>
      {children}
    </SiteImagesContext.Provider>
  );
}

/**
 * Get a site image URL by key, with a static fallback.
 * If the DB has no entry (or table is empty), returns the fallback.
 * @deprecated — prefer useSiteImageData() + <SiteImage> for full settings
 */
export function useSiteImage(key: string, fallback: string): string {
  const images = useContext(SiteImagesContext);
  return images[key]?.url || fallback;
}

/**
 * Get the full image settings (url, position, filters) by key.
 */
export function useSiteImageData(
  key: string,
  fallback: string
): SiteImageData {
  const images = useContext(SiteImagesContext);
  return images[key] || { url: fallback };
}

/* ─── <SiteImage> Component ───────────────────────────── */

interface SiteImageProps {
  /** image_key from the site_image_settings table */
  imageKey: string;
  /** Static fallback path if key isn't in the DB */
  fallback: string;
  alt: string;
  /** next/image sizes attribute */
  sizes?: string;
  /** If true, uses priority loading (above the fold) */
  priority?: boolean;
  /** Extra className for the <Image> element */
  className?: string;
  /** Override object-fit (default: "cover") */
  objectFit?: "cover" | "contain";
}

/**
 * Drop-in replacement for <Image> that automatically applies
 * the admin-configured object-position and CSS filters
 * from the site_image_settings table.
 *
 * Usage:
 *   <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
 *     <SiteImage imageKey="team-pailin-profile" fallback="/images/team/pailin-1.jpg" alt="Coach Pailin" />
 *   </div>
 */
export function SiteImage({
  imageKey,
  fallback,
  alt,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
  className = "",
  objectFit = "cover",
}: SiteImageProps) {
  const data = useSiteImageData(imageKey, fallback);

  const hasFilters =
    (data.brightness && data.brightness !== 1) ||
    (data.contrast && data.contrast !== 1) ||
    (data.saturate && data.saturate !== 1);

  const filterStyle = hasFilters
    ? {
        filter: `brightness(${data.brightness ?? 1}) contrast(${data.contrast ?? 1}) saturate(${data.saturate ?? 1})`,
      }
    : undefined;

  return (
    <Image
      src={data.url}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className={`object-${objectFit} ${className}`}
      style={{
        objectPosition: data.objectPosition || "50% 50%",
        ...filterStyle,
      }}
    />
  );
}
