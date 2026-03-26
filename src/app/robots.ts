import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://enjoyspeedbkk.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/packages", "/about", "/contact", "/booking"],
        // Disallow pages that redirect (auth-gated) or have no indexable content
        disallow: [
          "/admin",
          "/admin/",
          "/account/profile",
          "/bookings",
          "/auth/",
          "/api/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
