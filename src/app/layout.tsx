import type { Metadata } from "next";
import "@/styles/globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "En-Joy Speed | Premium Guided Cycling Bangkok",
  description:
    "Let us handle the speed. You enjoy the ride. Book premium guided cycling sessions on Bangkok's Skylane with curated experiences for duos, squads, and pelotons.",
  keywords: [
    "cycling Bangkok",
    "guided cycling",
    "Skylane cycling",
    "premium bike tour",
    "En-Joy Speed",
  ],
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "En-Joy Speed | Premium Guided Cycling Bangkok",
    description: "Let us handle the speed. You enjoy the ride.",
    type: "website",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts — loaded via link tag for reliability */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..800;1,9..40,300..800&family=Plus+Jakarta+Sans:wght@400..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-cream text-ink antialiased">
        <ToastProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
