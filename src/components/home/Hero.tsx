"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Play, Pause, Shield, Camera, Users, Volume2, VolumeX, SkipForward } from "lucide-react";
import { useSiteImage } from "@/lib/site-images-context";
import { useToast } from "@/components/ui/Toast";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { HeroVideo } from "@/lib/actions/hero-videos";
import type { LiveConfig } from "@/lib/config-types";

const stats = [
  { icon: Shield, i18nKey: "hero.athleteLed" },
  { icon: Camera, i18nKey: "hero.photographyIncluded" },
  { icon: Users, i18nKey: "hero.smallGroupsOnly" },
];

const CLIP_DURATION = 3; // seconds per clip

interface HeroProps {
  videos?: HeroVideo[];
  liveConfig?: LiveConfig;
}

export function Hero({ videos = [], liveConfig }: HeroProps) {
  const { t } = useLanguage();
  const heroStill = useSiteImage("hero-still", "/images/hero-golden-hour-still.jpg");
  const toast = useToast();

  // Use passed videos or empty array (will handle gracefully)
  const HERO_VIDEOS = videos && videos.length > 0 ? videos : [];

  const [videoPlaying, setVideoPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [posterReady, setPosterReady] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const wasPlayingBeforeHide = useRef(false);

  // Load first video to show its first frame as poster
  useEffect(() => {
    const firstVideo = videoRefs.current[0];
    if (firstVideo) {
      firstVideo.preload = "auto";
      firstVideo.currentTime = 0.001; // Seek to first frame so it renders
      const onSeeked = () => {
        setPosterReady(true);
        firstVideo.removeEventListener("seeked", onSeeked);
      };
      firstVideo.addEventListener("seeked", onSeeked);
      firstVideo.load();
    }
  }, []);

  // Preload a video by index (triggers full download)
  const preloadVideo = useCallback((index: number) => {
    const video = videoRefs.current[index];
    if (video && video.preload !== "auto") {
      video.preload = "auto";
      video.load();
    }
  }, []);

  // Advance to next clip after CLIP_DURATION seconds
  const scheduleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % HERO_VIDEOS.length;
        // Keep previous video visible during crossfade
        setPrevIndex(prev);
        // Play next video
        const nextVideo = videoRefs.current[next];
        if (nextVideo) {
          nextVideo.currentTime = 0;
          nextVideo.play().catch((error) => {
            console.warn("Failed to play video at index", next, error);
            setVideoError(true);
          });
        }
        // After fade completes (900ms), pause old video and clear prevIndex
        if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = setTimeout(() => {
          const oldVideo = videoRefs.current[prev];
          if (oldVideo) oldVideo.pause();
          setPrevIndex(null);
        }, 900);
        // Preload the one after next so it's ready
        const upcoming = (next + 1) % HERO_VIDEOS.length;
        preloadVideo(upcoming);
        return next;
      });
    }, CLIP_DURATION * 1000);
  }, [preloadVideo]);

  // Whenever activeIndex changes while playing, schedule the next transition
  useEffect(() => {
    if (videoPlaying) {
      scheduleNext();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeIndex, videoPlaying, scheduleNext]);

  const handleTogglePause = useCallback(() => {
    if (!videoPlaying) return;
    const activeVideo = videoRefs.current[activeIndex];
    if (paused) {
      // Resume
      if (activeVideo) {
        activeVideo.play().catch((error) => {
          console.warn("Failed to resume video:", error);
          setVideoError(true);
        });
      }
      setPaused(false);
      scheduleNext();
    } else {
      // Pause
      if (timerRef.current) clearTimeout(timerRef.current);
      if (activeVideo) activeVideo.pause();
      setPaused(true);
    }
  }, [videoPlaying, activeIndex, paused, scheduleNext]);

  const handlePlayVideo = () => {
    // Start from clip 0
    setActiveIndex(0);
    // Preload clip 1 so it's ready when clip 0 ends
    preloadVideo(1);
    videoRefs.current.forEach((v, i) => {
      if (v) {
        v.muted = true; // Start muted for autoplay
        v.currentTime = 0;
        if (i === 0) {
          v.play()
            .then(() => {
              setVideoPlaying(true);
              setPaused(false);
              setMuted(true);
              setVideoError(false);
            })
            .catch((error) => {
              console.warn("Video playback failed:", error);
              setVideoError(true);
              toast.warning("Video unavailable — showing the ride experience instead.");
            });
        } else {
          v.pause();
        }
      }
    });
  };

  const handleSkipVideo = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveIndex((prev) => {
      const next = (prev + 1) % HERO_VIDEOS.length;
      setPrevIndex(prev);
      const nextVideo = videoRefs.current[next];
      if (nextVideo) {
        nextVideo.currentTime = 0;
        nextVideo.play().catch((error) => {
          console.warn("Failed to play skipped video:", error);
          setVideoError(true);
        });
      }
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = setTimeout(() => {
        const oldVideo = videoRefs.current[prev];
        if (oldVideo) oldVideo.pause();
        setPrevIndex(null);
      }, 400);
      preloadVideo((next + 1) % HERO_VIDEOS.length);
      return next;
    });
  }, [preloadVideo]);

  const handleCloseVideo = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    setPrevIndex(null);
    setVideoPlaying(false);
    videoRefs.current.forEach((v) => {
      if (v) v.pause();
    });
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const newMuted = !prev;
      videoRefs.current.forEach((v) => {
        if (v) v.muted = newMuted;
      });
      return newMuted;
    });
  }, []);

  // Keyboard controls for video: Space=play/pause, M=mute, N/→=skip, Esc=close
  useEffect(() => {
    if (!videoPlaying) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { handleCloseVideo(); }
      else if (e.key === " ") { e.preventDefault(); handleTogglePause(); }
      else if (e.key === "m" || e.key === "M") { toggleMute(); }
      else if (e.key === "ArrowRight" || e.key === "n" || e.key === "N") { handleSkipVideo(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [videoPlaying, handleCloseVideo, handleSkipVideo, handleTogglePause, toggleMute]);

  // Pause video when hero scrolls out of viewport — saves bandwidth
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const nowVisible = entry.isIntersecting;
        setIsVisible(nowVisible);

        if (!nowVisible && videoPlaying) {
          // Scrolled away — pause all videos
          wasPlayingBeforeHide.current = true;
          videoRefs.current.forEach((v) => { if (v) v.pause(); });
          if (timerRef.current) clearTimeout(timerRef.current);
        } else if (nowVisible && wasPlayingBeforeHide.current) {
          // Scrolled back — resume active video
          wasPlayingBeforeHide.current = false;
          const activeVideo = videoRefs.current[activeIndex];
          if (activeVideo) {
            activeVideo.play().catch((error) => {
              console.warn("Failed to resume video after scroll:", error);
              setVideoError(true);
            });
          }
        }
      },
      { threshold: 0.15 } // triggers when <15% visible
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [videoPlaying, activeIndex]);

  return (
    <section ref={sectionRef} className="relative min-h-[100svh] flex items-center overflow-x-clip">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-cream via-cream-dark/50 to-sky-light/15" />
        <div className="absolute top-[10%] right-[5%] w-[500px] h-[500px] rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] rounded-full bg-sky/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Copy */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Link
                href="/booking"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-transparent border border-accent/30 mb-8 hover:bg-accent/5 transition-colors group"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-ink-muted">
                  {t('hero.tagline')}
                </span>
                <span className="text-xs text-accent font-medium group-hover:translate-x-0.5 transition-transform">
                  →
                </span>
              </Link>
            </motion.div>

            <h1 className="text-balance">
              <span className="block text-navy">{t('common.heroTitle')}</span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-lg text-ink-muted max-w-lg"
            >
              {t('hero.description')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8"
            >
              <Link
                href="/booking"
                className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:bg-accent-dark transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                {t('hero.ctaMain')}
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-10 flex flex-wrap gap-6"
            >
              {stats.map((stat) => (
                <div key={stat.i18nKey} className="flex items-center gap-2">
                  <stat.icon className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium text-ink-muted">
                    {t(stat.i18nKey)}
                  </span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — Video/Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative aspect-[4/5] lg:aspect-[3/4] rounded-3xl overflow-hidden shadow-xl">
              {/* Fallback poster image — shown until first video frame loads */}
              {!posterReady && !videoPlaying && (
                <Image
                  src={heroStill}
                  alt="Cyclists riding at golden hour on Bangkok Skylane"
                  fill
                  className="object-cover z-[1]"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              )}

              {/* Video elements — first video's frame 0 serves as the poster */}
              {HERO_VIDEOS.map((clip, i) => {
                const isActive = videoPlaying && i === activeIndex;
                const isPrev = videoPlaying && i === prevIndex;
                // First video is always visible (as poster when not playing, as active when playing)
                const isPoster = !videoPlaying && i === 0 && posterReady;
                return (
                  <video
                    key={clip.src}
                    ref={(el) => { videoRefs.current[i] = el; }}
                    src={clip.src}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      opacity: isActive || isPoster ? 1 : isPrev ? 1 : 0,
                      zIndex: isActive ? 20 : isPrev ? 10 : isPoster ? 2 : 0,
                      transition: "opacity 800ms ease-in-out",
                    }}
                    playsInline
                    controls={false}
                    muted={muted}
                    preload={i === 0 ? "auto" : "metadata"}
                    onClick={videoPlaying ? handleTogglePause : undefined}
                  />
                );
              })}

              {/* Pause indicator — shown when user taps to pause */}
              <AnimatePresence>
                {videoPlaying && paused && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 z-[21] flex items-center justify-center cursor-pointer"
                    onClick={handleTogglePause}
                  >
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm">
                      <Play className="h-7 w-7 text-white ml-0.5" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Gradient overlay — must be below play button (z-15) and floating card (z-25) */}
              <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-navy/10 to-transparent z-[3] pointer-events-none" />

              {/* Play button */}
              <AnimatePresence>
                {!videoPlaying && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handlePlayVideo}
                    className="absolute inset-0 z-[15] flex items-center justify-center group cursor-pointer"
                    aria-label="Play video"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center justify-center w-20 h-20 rounded-full bg-white/90 shadow-2xl backdrop-blur-sm group-hover:bg-white transition-all"
                    >
                      <Play className="h-8 w-8 text-accent ml-1" />
                    </motion.div>
                    <span className="absolute bottom-24 left-1/2 -translate-x-1/2 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm whitespace-nowrap">
                      {t('hero.watchVideoPrompt')}
                    </span>
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Video controls */}
              <AnimatePresence>
                {videoPlaying && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute bottom-4 left-4 right-4 z-30"
                  >
                    {/* Progress dots */}
                    <div className="flex justify-center gap-1.5 mb-3">
                      {HERO_VIDEOS.map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 rounded-full transition-all duration-300 ${
                            i === activeIndex
                              ? "w-6 bg-white"
                              : i < activeIndex
                              ? "w-1.5 bg-white/60"
                              : "w-1.5 bg-white/30"
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                        className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
                      >
                        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSkipVideo(); }}
                        className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
                        title="Next clip"
                      >
                        <SkipForward className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCloseVideo}
                        className="px-3 py-1.5 rounded-full bg-black/50 text-white text-xs font-medium hover:bg-black/70 transition-colors backdrop-blur-sm"
                      >
                        {t('common.closeModal')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Floating card */}
              <AnimatePresence>
                {!videoPlaying && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ delay: 0.8 }}
                    className="absolute bottom-6 left-4 right-4 z-[25]"
                  >
                    <div className="block glass rounded-2xl p-4 border border-white/30 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-ink-muted uppercase tracking-wider">
                          {t('hero.nextAvailable')}
                        </p>
                        <p className="text-base font-bold text-navy mt-0.5">
                          {t('hero.goldenHourRide')}
                        </p>
                        <p className="text-sm text-ink-muted">
                          {(() => { const s = liveConfig?.timeSlots?.find(s => s.id === "C"); return s ? `${s.startTime} — ${s.endTime}` : "16:45 — 18:45"; })()} &middot; {t('hero.staffPick')}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                          {t('hero.smallGroupsOnly')}
                        </span>
                        <span className="text-lg font-bold text-navy mt-1">
                          {t('hero.from')} {(() => { const prices = (liveConfig?.packages ?? []).map(p => p.pricePerPerson); return prices.length > 0 ? Math.min(...prices).toLocaleString() : "2,000"; })()}
                          <span className="text-xs font-normal text-ink-muted">
                            {" "}THB
                          </span>
                        </span>
                        <span className="text-xs text-ink-muted mt-1">
                          {t('packages.bikeRental')}
                        </span>
                      </div>
                    </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Floating price badge */}
            <AnimatePresence>
              {!videoPlaying && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: 1 }}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/90 text-navy rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-md backdrop-blur-sm max-w-[140px] sm:max-w-none z-[2]"
                >
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-ink-muted opacity-70">
                    {t('hero.from')}
                  </p>
                  <p className="text-lg sm:text-xl font-bold leading-tight">
                    {(() => { const prices = (liveConfig?.packages ?? []).map(p => p.pricePerPerson); return prices.length > 0 ? Math.min(...prices).toLocaleString() : "2,000"; })()}
                    <span className="text-xs sm:text-sm font-normal text-ink-muted opacity-80"> THB</span>
                  </p>
                  <p className="text-xs text-ink-muted">{t('hero.perPerson')}</p>
                  <p className="text-xs text-ink-muted mt-1.5 pt-1.5 border-t border-navy/10">
                    {t('hero.whatsIncluded')}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
