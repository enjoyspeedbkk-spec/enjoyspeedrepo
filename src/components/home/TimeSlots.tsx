"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Sunrise, Sunset, Clock, MapPin } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";

const slots = [
  {
    id: "A1",
    label: "Early Bird",
    time: "06:15 — 08:15",
    period: "morning" as const,
    mood: "Fresh morning air, quiet roads, clean start. Perfect for performance-focused riders.",
    vibe: "Performance",
  },
  {
    id: "A2",
    label: "Energy Booster",
    time: "06:30 — 08:30",
    period: "morning" as const,
    mood: "An energizing start to your day. Catch the sunrise over the Skylane as Bangkok wakes up.",
    vibe: "Energizing",
  },
  {
    id: "B",
    label: "Light Chaser",
    time: "16:15 — 18:15",
    period: "evening" as const,
    mood: "Chase the afternoon light as the heat breaks. Ride into the golden glow.",
    vibe: "Scenic",
  },
  {
    id: "C",
    label: "Golden Hour",
    time: "16:45 — 18:45",
    period: "evening" as const,
    mood: "The signature En-Joy Speed experience. Perfect light, perfect vibes, perfect photos.",
    vibe: "Staff Pick",
    staffPick: true,
  },
  {
    id: "D",
    label: "Twilight Finish",
    time: "17:15 — 19:15",
    period: "evening" as const,
    mood: "End your day with a cool evening breeze and a sunset finish on the Skylane.",
    vibe: "Chill",
  },
];

export function TimeSlots() {
  const morningSlots = slots.filter((s) => s.period === "morning");
  const eveningSlots = slots.filter((s) => s.period === "evening");

  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          badge="Session Times"
          title="Ride when it feels right"
          subtitle="Mornings for performance and fresh air. Evenings for golden light and vibes. Every session on the Skylane's dedicated 23.5 km track at Suvarnabhumi."
        />

        {/* Route photo strip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-12 rounded-2xl overflow-hidden h-48 lg:h-64 relative"
        >
          <Image
            src="/images/group-ride.jpg"
            alt="Group ride on the Skylane at sunset"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/50 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">
                Skylane &middot; Happy and Healthy Bike Lane
              </p>
              <p className="text-white text-lg font-bold mt-0.5">
                23.5 km &middot; Blue &amp; Purple lanes &middot; Suvarnabhumi
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-white/70 text-sm">
              <MapPin className="h-4 w-4" />
              Bangkok
            </div>
          </div>
        </motion.div>

        {/* Morning */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sky/10">
              <Sunrise className="h-5 w-5 text-sky" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Morning Sessions</h3>
              <p className="text-sm text-ink-muted">
                Clean air, cool temps, quiet roads
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {morningSlots.map((slot, i) => (
              <motion.div
                key={slot.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card hover padding="md" className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs font-bold text-sky bg-sky/10 px-2 py-0.5 rounded-full">
                        Slot {slot.id}
                      </span>
                      <h4 className="text-base font-bold mt-2">{slot.label}</h4>
                    </div>
                    <span className="text-xs font-medium text-ink-muted bg-sand/50 px-2.5 py-1 rounded-full">
                      {slot.vibe}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-ink mb-2">
                    <Clock className="h-3.5 w-3.5 text-ink-muted" />
                    {slot.time}
                  </div>
                  <p className="text-sm text-ink-muted leading-relaxed flex-1">
                    {slot.mood}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-muted flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-warning" />
            Morning slots A1 and A2 overlap — only one can be booked per day.
          </p>
        </div>

        {/* Evening */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10">
              <Sunset className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Evening Sessions</h3>
              <p className="text-sm text-ink-muted">
                Golden light, sunset views, perfect atmosphere
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {eveningSlots.map((slot, i) => (
              <motion.div
                key={slot.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card hover padding="md" className={`flex flex-col h-full ${slot.staffPick ? "ring-1 ring-accent/20 border-accent/30" : ""}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                        Slot {slot.id}
                      </span>
                      <h4 className="text-base font-bold mt-2">{slot.label}</h4>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      slot.staffPick
                        ? "text-accent-dark bg-accent/10 font-bold"
                        : "text-ink-muted bg-sand/50"
                    }`}>
                      {slot.vibe}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-ink mb-2">
                    <Clock className="h-3.5 w-3.5 text-ink-muted" />
                    {slot.time}
                  </div>
                  <p className="text-sm text-ink-muted leading-relaxed flex-1">
                    {slot.mood}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bathroom stops info */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 text-center text-sm text-ink-muted"
        >
          <p>
            Bathroom stops at km 5, 11, and 16 &middot; Pre-arranged by your
            Leader &middot; Blue lane (relaxed) &amp; Purple lane (fast)
          </p>
        </motion.div>
      </div>
    </section>
  );
}
