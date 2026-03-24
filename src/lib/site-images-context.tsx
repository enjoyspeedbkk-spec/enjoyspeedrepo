"use client";

import { createContext, useContext, ReactNode } from "react";

/** Map of image_key → current_url */
type SiteImageMap = Record<string, string>;

const SiteImagesContext = createContext<SiteImageMap>({});

export function SiteImagesProvider({
  images,
  children,
}: {
  images: SiteImageMap;
  children: ReactNode;
}) {
  return (
    <SiteImagesContext.Provider value={images}>
      {children}
    </SiteImagesContext.Provider>
  );
}

/**
 * Get a site image URL by key, with a static fallback.
 * If the DB has no entry (or table is empty), returns the fallback.
 */
export function useSiteImage(key: string, fallback: string): string {
  const images = useContext(SiteImagesContext);
  return images[key] || fallback;
}
