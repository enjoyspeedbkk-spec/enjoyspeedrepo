"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Play, Shield, Camera, Users } from "lucide-react";

const stats = [
  { icon: Shield, label: "Athlete-Led & Safe" },
  { icon: Camera, label: "Photography Included" },
  { icon: Users, label: "Small Groups Only" },
];

export function Hero() {
  return (
    <section className="relative min-h-[100svh] flex items-center overflow-hidden">
      {/* Background gradient — fresh, airy, with a hint of sky blue */}
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
              <span className="block mt-2 bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">
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
              <button className="group inline-flex items-center gap-2.5 rounded-full border-2 border-navy/10 bg-surface/60 backdrop-blur-sm px-6 py-3.5 text-base font-semibold text-navy hover:border-navy/20 hover:bg-surface transition-all duration-300">
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

          {/* Right — Real Photography */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            {/* Main image — real sunset ride photo */}
            <div className="relative aspect-[4/5] lg:aspect-[3/4] rounded-3xl overflow-hidden shadow-xl">
              <Image
                src="/images/hero-ride.jpg"
                alt="Cyclists riding the Skylane at sunset"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {/* Subtle gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-navy/40 via-transparent to-transparent" />

              {/* Floating card — Session info */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute bottom-6 left-4 right-4 glass rounded-2xl p-4 border border-white/40 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-ink-muted uppercase tracking-wider">
                      Next Available
                    </p>
                    <p className="text-base font-bold text-navy mt-0.5">
                      Golden Hour Ride
                    </p>
                    <p className="text-sm text-ink-muted">
                      16:45 — 18:45 &middot; Staff Pick
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
            </div>

            {/* Floating accent element */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="absolute -top-4 -right-4 bg-accent text-white rounded-2xl px-4 py-3 shadow-lg"
            >
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                From
              </p>
              <p className="text-2xl font-bold">
                2,000
                <span className="text-sm font-normal opacity-80"> THB</span>
              </p>
              <p className="text-xs opacity-80">per person</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
