"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Camera } from "lucide-react";

// Static fallback photos (used when Places API is unavailable)
const FALLBACK_PHOTOS = [
  { src: "/images/venue/skylane-canopy.jpg", alt: "Skylane covered cycling track canopy" },
  { src: "/images/venue/entrance.jpg", alt: "Skylane Happy and Healthy Bike Lane entrance" },
  { src: "/images/venue/rest-stop.jpg", alt: "Rest stop along the Skylane bike lane" },
  { src: "/images/venue/cafe.jpg", alt: "Café area near the Skylane cycling track" },
];

const AUTOPLAY_INTERVAL = 5000;

interface SkylaneCarouselProps {
  /** Photo URLs from Google Places API */
  placePhotos?: string[];
}

export function SkylaneCarousel({ placePhotos = [] }: SkylaneCarouselProps) {
  const hasPlacePhotos = placePhotos.length > 0;
  const photos = hasPlacePhotos
    ? placePhotos.map((url, i) => ({ src: url, alt: `Skylane bike lane photo ${i + 1}` }))
    : FALLBACK_PHOTOS;

  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (index: number, dir: number) => {
      setDirection(dir);
      setCurrent(index);
    },
    []
  );

  const next = useCallback(() => {
    goTo((current + 1) % photos.length, 1);
  }, [current, goTo, photos.length]);

  const prev = useCallback(() => {
    goTo((current - 1 + photos.length) % photos.length, -1);
  }, [current, goTo, photos.length]);

  // Autoplay
  useEffect(() => {
    timerRef.current = setInterval(next, AUTOPLAY_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [next]);

  const pauseAutoplay = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };
  const resumeAutoplay = () => {
    timerRef.current = setInterval(next, AUTOPLAY_INTERVAL);
  };

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-sand/40 group"
      onMouseEnter={pauseAutoplay}
      onMouseLeave={resumeAutoplay}
    >
      {/* Image container */}
      <div className="relative aspect-[16/9]">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "tween", duration: 0.4, ease: "easeInOut" },
              opacity: { duration: 0.3 },
            }}
            className="absolute inset-0"
          >
            {/* Google Places photos are external URLs — use <img> for those, Next Image for local */}
            {hasPlacePhotos ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photos[current].src}
                alt={photos[current].alt}
                className="w-full h-full object-cover"
                loading={current === 0 ? "eager" : "lazy"}
              />
            ) : (
              <Image
                src={photos[current].src}
                alt={photos[current].alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 800px, 900px"
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent z-[2] pointer-events-none" />
      </div>

      {/* Google Maps attribution badge */}
      {hasPlacePhotos && (
        <div className="absolute top-3 left-3 z-[3] flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs">
          <Camera className="h-3 w-3" />
          <span>Google Maps</span>
        </div>
      )}

      {/* Navigation arrows */}
      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-[3] w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-5 w-5 text-ink" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-[3] w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            aria-label="Next photo"
          >
            <ChevronRight className="h-5 w-5 text-ink" />
          </button>
        </>
      )}

      {/* Dots */}
      {photos.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[3] flex gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > current ? 1 : -1)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-5 bg-white"
                  : "w-1.5 bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Go to photo ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Counter */}
      <div className="absolute top-3 right-3 z-[3] px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium">
        {current + 1} / {photos.length}
      </div>
    </div>
  );
}
