"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const imageSlides = [
  {
    src: "/images/gallery/morning-ride.jpg",
    altKey: "gallery.guidedRidesEveryMorningAndEvening",
    captionKey: "gallery.guidedRidesEveryMorningAndEvening",
  },
  {
    src: "/images/gallery/ride-group-1.jpg",
    altKey: "gallery.smallGroupsBigExperiences",
    captionKey: "gallery.smallGroupsBigExperiences",
  },
  {
    src: "/images/gallery/skylane-architecture.jpg",
    altKey: "gallery.worldClassInfrastructure",
    captionKey: "gallery.worldClassInfrastructure",
  },
  {
    src: "/images/gallery/ride-action-1.jpg",
    altKey: "gallery.feelTheRhythm",
    captionKey: "gallery.feelTheRhythm",
  },
  {
    src: "/images/gallery/ride-group-2.jpg",
    altKey: "gallery.betterTogether",
    captionKey: "gallery.betterTogether",
  },
  {
    src: "/images/gallery/rider-portrait.jpg",
    altKey: "gallery.yourMoment",
    captionKey: "gallery.yourMoment",
  },
  {
    src: "/images/gallery/sunrise-2.jpg",
    altKey: "gallery.catchTheSunrise",
    captionKey: "gallery.catchTheSunrise",
  },
];

export function GalleryCarousel() {
  const { t } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Touch/swipe support
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % imageSlides.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + imageSlides.length) % imageSlides.length);
  }, []);

  // Auto-advance every 5 seconds, pauses on hover/touch
  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [next, paused]);

  // Touch handlers for swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setPaused(true);
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      // Only swipe if horizontal movement > vertical (prevent scroll hijack)
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
        if (deltaX < 0) next();
        else prev();
      }
      touchStartX.current = null;
      touchStartY.current = null;
      // Resume auto-play after 4s
      setTimeout(() => setPaused(false), 4000);
    },
    [next, prev]
  );

  return (
    <section className="py-20 lg:py-28 bg-ink overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 lg:mb-14"
        >
          <p className="text-accent text-sm font-semibold uppercase tracking-wider mb-3">
            {t('gallery.theExperience')}
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-white max-w-xl">
            {t('gallery.seeWhatARideLooksLike')}
          </h2>
        </motion.div>

        {/* Carousel — crossfade approach, no sliding */}
        <div className="relative">
          <div
            ref={containerRef}
            className="relative aspect-[16/9] lg:aspect-[21/9] rounded-2xl overflow-hidden bg-ink-light"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* All images stacked — active one fades in via CSS transition */}
            {imageSlides.map((img, i) => (
              <div
                key={img.src}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  i === current ? "opacity-100 z-10" : "opacity-0 z-0"
                }`}
                aria-hidden={i !== current}
              >
                <Image
                  src={img.src}
                  alt={t(img.altKey)}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 1200px"
                  priority={i < 2}
                  loading={i < 2 ? "eager" : "lazy"}
                />
              </div>
            ))}

            {/* Bottom gradient for caption */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-20 pointer-events-none" />

            {/* Caption */}
            <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8 z-30">
              <p
                key={current}
                className="text-white text-lg lg:text-xl font-medium transition-opacity duration-500"
              >
                {t(imageSlides[current].captionKey)}
              </p>
            </div>

            {/* Nav arrows */}
            <button
              onClick={() => {
                prev();
                setPaused(true);
                setTimeout(() => setPaused(false), 4000);
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/35 text-white transition-colors backdrop-blur-sm z-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={t('gallery.prevImage')}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                next();
                setPaused(true);
                setTimeout(() => setPaused(false), 4000);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/35 text-white transition-colors backdrop-blur-sm z-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={t('gallery.nextImage')}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Dot indicators */}
          <div className="flex justify-center gap-2 mt-5">
            {imageSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrent(i);
                  setPaused(true);
                  setTimeout(() => setPaused(false), 4000);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${
                  i === current
                    ? "w-8 bg-accent"
                    : "w-1.5 bg-white/30 hover:bg-white/50"
                }`}
                aria-label={t('gallery.goToImage', { number: i + 1 })}
                aria-current={i === current ? "true" : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
