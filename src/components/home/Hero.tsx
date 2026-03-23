"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Play, Shield, Camera, Users, Volume2, VolumeX, SkipForward, X } from "lucide-react";

const stats = [
  { icon: Shield, label: "Athlete-Led & Safe" },
  { icon: Camera, label: "Photography Included" },
  { icon: Users, label: "Small Groups Only" },
];

/* ─── Video carousel (plays on demand) ─── */
const SUPABASE_VIDEO_BASE =
  "https://oqldbxkluuoyrmzehkpk.supabase.co/storage/v1/object/public/videos";
const CLIP_DURATION = 3;
const HERO_VIDEOS = [
  { src: `${SUPABASE_VIDEO_BASE}/video%20of%20cycling%20golden%20hour%20morning%20vertical.mp4`, label: "Golden Hour Morning" },
  { src: `${SUPABASE_VIDEO_BASE}/front%20facing%20golden%20hour%20vertical.mp4`, label: "Front Facing" },
  { src: `${SUPABASE_VIDEO_BASE}/Side%20view%20of%20sunrise%20golden%20hour%20cycling%20video%20vertical.mp4`, label: "Sunrise Side View" },
  { src: `${SUPABASE_VIDEO_BASE}/Video%20of%20cycling%20in%20the%20morning%20blue%20hour%20vertical.mp4`, label: "Blue Hour" },
  { src: `${SUPABASE_VIDEO_BASE}/wide%20angle%20blue%20hour%20morning%20vertical.mp4`, label: "Wide Angle" },
];

/* ─── Dynamic next-available slot (Bangkok UTC+7) ─── */
const SLOTS = [
  { label: "Early Bird",      start: "06:15", end: "08:15", hour: 6,  min: 15 },
  { label: "Energy Booster",  start: "06:30", end: "08:30", hour: 6,  min: 30 },
  { label: "Light Chaser",    start: "16:15", end: "18:15", hour: 16, min: 15 },
  { label: "Golden Hour",     start: "16:45", end: "18:45", hour: 16, min: 45 },
  { label: "Twilight Finish", start: "17:15", end: "19:15", hour: 17, min: 15 },
];

function getNextSlot() {
  const now = new Date();
  const bangkokHour = (now.getUTCHours() + 7) % 24;
  const bangkokMin = now.getUTCMinutes();
  const nowMins = bangkokHour * 60 + bangkokMin;
  return SLOTS.find((s) => s.hour * 60 + s.min > nowMins) || SLOTS[0];
}

export function Hero() {
  const nextSlot = useMemo(() => getNextSlot(), []);

  /* ─── Video state ─── */
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const wasPlayingBeforeHide = useRef(false);

  const preloadVideo = useCallback((index: number) => {
    const video = videoRefs.current[index];
    if (video && video.preload !== "auto") {
      video.preload = "auto";
      video.load();
    }
  }, []);

  /* ─── Carousel auto-advance ─── */
  const scheduleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % HERO_VIDEOS.length;
        setPrevIndex(prev);
        const nextVideo = videoRefs.current[next];
        if (nextVideo) { nextVideo.currentTime = 0; nextVideo.play().catch(() => {}); }
        if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = setTimeout(() => {
          const oldVideo = videoRefs.current[prev];
          if (oldVideo) oldVideo.pause();
          setPrevIndex(null);
        }, 400);
        preloadVideo((next + 1) % HERO_VIDEOS.length);
        return next;
      });
    }, CLIP_DURATION * 1000);
  }, [preloadVideo]);

  useEffect(() => {
    if (videoPlaying) scheduleNext();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [activeIndex, videoPlaying, scheduleNext]);

  const handlePlayVideo = () => {
    setActiveIndex(0);
    preloadVideo(1);
    videoRefs.current.forEach((v, i) => {
      if (v) {
        v.muted = true;
        v.currentTime = 0;
        if (i === 0) {
          v.play().then(() => { setVideoPlaying(true); setMuted(true); }).catch(() => {});
        } else { v.pause(); }
      }
    });
  };

  const handleSkipVideo = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveIndex((prev) => {
      const next = (prev + 1) % HERO_VIDEOS.length;
      setPrevIndex(prev);
      const nextVideo = videoRefs.current[next];
      if (nextVideo) { nextVideo.currentTime = 0; nextVideo.play().catch(() => {}); }
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
    videoRefs.current.forEach((v) => { if (v) v.pause(); });
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const newMuted = !prev;
      videoRefs.current.forEach((v) => { if (v) v.muted = newMuted; });
      return newMuted;
    });
  }, []);

  /* ─── Keyboard shortcuts when video is playing ─── */
  useEffect(() => {
    if (!videoPlaying) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCloseVideo();
      else if (e.key.toLowerCase() === "m") toggleMute();
      else if (e.key === "ArrowRight" || e.key.toLowerCase() === "n") handleSkipVideo();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [videoPlaying, handleCloseVideo, handleSkipVideo, toggleMute]);

  /* ─── Pause when scrolled away ─── */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && videoPlaying) {
          wasPlayingBeforeHide.current = true;
          videoRefs.current.forEach((v) => { if (v) v.pause(); });
          if (timerRef.current) clearTimeout(timerRef.current);
        } else if (entry.isIntersecting && wasPlayingBeforeHide.current) {
          wasPlayingBeforeHide.current = false;
          const activeVideo = videoRefs.current[activeIndex];
          if (activeVideo) activeVideo.play().catch(() => {});
        }
      },
      { threshold: 0.15 }
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
          {/* ═══ Left — Copy ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-8"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-sm font-medium text-accent-dark">
                Now booking — Skylane 23.5 km, Suvarnabhumi
              </span>
            </motion.div>

            <h1 className="text-balance">
              <span className="block text-navy">Let us handle</span>
              <span className="block text-navy">the speed.</span>
              <span className="block mt-2 pb-1 leading-tight bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">
                You enjoy the ride.
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-lg text-ink-muted max-w-lg"
            >
              Premium guided cycling on Bangkok&apos;s Skylane. Led by Athlete
              Leaders, supported by Hero riders, with photography, safety, and
              post-ride recovery all handled for you.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <Link
                href="/booking"
                className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:bg-accent-dark transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                Book Your Ride
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <button
                onClick={handlePlayVideo}
                className="group inline-flex items-center gap-2.5 rounded-full border-2 border-navy/10 bg-surface/60 backdrop-blur-sm px-6 py-3.5 text-base font-semibold text-navy hover:border-navy/20 hover:bg-surface transition-all duration-300"
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-colors">
                  <Play className="h-3.5 w-3.5 text-accent ml-0.5" />
                </span>
                See It In Action
              </button>
            </motion.div>

            {/* Trust Row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-10 flex flex-wrap gap-6"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-2">
                  <stat.icon className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium text-ink-muted">
                    {stat.label}
                  </span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ═══ Right — Image + Video overlay ═══ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative pt-6 pr-6"
          >
            <div className="relative aspect-[4/5] lg:aspect-[3/4] rounded-3xl overflow-hidden shadow-xl">
              {/* Static hero image — always visible when video is off */}
              {!videoPlaying && (
                <Image
                  src="/images/hero-ride.jpg"
                  alt="Cyclists riding the Skylane at sunset"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              )}

              {/* Video layers — only rendered during playback */}
              {HERO_VIDEOS.map((clip, i) => {
                const isActive = videoPlaying && i === activeIndex;
                const isPrev = videoPlaying && i === prevIndex;
                return (
                  <video
                    key={clip.src}
                    ref={(el) => { videoRefs.current[i] = el; }}
                    src={clip.src}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                      isActive ? "opacity-100 z-20" : isPrev ? "opacity-100 z-10" : "opacity-0 z-0"
                    }`}
                    playsInline
                    controls={false}
                    muted={muted}
                    preload="metadata"
                  />
                );
              })}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-navy/40 via-transparent to-transparent z-[3]" />

              {/* Floating card — visible when video is NOT playing */}
              <AnimatePresence>
                {!videoPlaying && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ delay: 0.8 }}
                    className="absolute bottom-6 left-4 right-4 glass rounded-2xl p-4 border border-white/40 shadow-lg z-[5]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-ink-muted uppercase tracking-wider">
                          Next Available
                        </p>
                        <p className="text-base font-bold text-navy mt-0.5">
                          {nextSlot.label} Ride
                        </p>
                        <p className="text-sm text-ink-muted">
                          {nextSlot.start} — {nextSlot.end} &middot; Staff Pick
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                          3 spots left
                        </span>
                        <span className="text-lg font-bold text-navy mt-1">
                          2,100
                          <span className="text-xs font-normal text-ink-muted">
                            {" "}THB
                          </span>
                        </span>
                      </div>
                    </div>
                  </motion.div>
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
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={activeIndex}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-xs text-white/80 font-medium mb-2 text-center"
                      >
                        {HERO_VIDEOS[activeIndex].label} &middot; {activeIndex + 1}/{HERO_VIDEOS.length}
                      </motion.p>
                    </AnimatePresence>

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
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 text-white text-xs font-medium hover:bg-black/70 transition-colors backdrop-blur-sm"
                      >
                        <X className="h-3.5 w-3.5" />
                        Close
                      </button>
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
                  className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-accent text-white rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-lg max-w-[120px] sm:max-w-none z-10"
                >
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider opacity-80">
                    From
                  </p>
                  <p className="text-lg sm:text-2xl font-bold leading-tight">
                    2,000
                    <span className="text-xs sm:text-sm font-normal opacity-80"> THB</span>
                  </p>
                  <p className="text-[10px] sm:text-xs opacity-80">per person</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
