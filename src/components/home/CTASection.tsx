"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 lg:py-32 bg-ink relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-sky/5 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/15 border border-accent/20 mb-8">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span className="text-sm font-medium text-accent">
              Sessions fill up fast
            </span>
          </div>

          <h2 className="text-cream text-balance">
            Ready to ride?
          </h2>
          <p className="mt-4 text-lg text-cream/50 max-w-xl mx-auto text-balance">
            Book your premium guided cycling session today. Limited spots per
            session, guaranteed personal attention.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/booking"
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-base font-bold text-white shadow-lg hover:shadow-xl hover:bg-accent-light transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              Book Your Ride
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/packages"
              className="inline-flex items-center gap-2 rounded-full border border-cream/15 px-6 py-4 text-base font-semibold text-cream/70 hover:text-cream hover:border-cream/30 transition-all duration-300"
            >
              Explore Ride Formats
            </Link>
          </div>

          <p className="mt-8 text-sm text-cream/30">
            Book at least 24 hours in advance. Confirmation and meetup details
            sent via LINE.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
