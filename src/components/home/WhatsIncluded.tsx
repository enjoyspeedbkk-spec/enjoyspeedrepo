"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  Shield,
  Camera,
  Users,
  Wind,
  Droplets,
  Package,
  Shirt,
  HeartPulse,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";

const included = [
  {
    icon: Users,
    title: "Athlete Leaders",
    description:
      "Elite local cyclists who set the pace, guide the route, and ensure the group stays safe. They lead from the front.",
  },
  {
    icon: Shield,
    title: "Hero Support Riders",
    description:
      "Sweep riders at the back of the group, watching over every participant. No one gets left behind.",
  },
  {
    icon: Camera,
    title: "Professional Photography",
    description:
      "Action shots and group photos from your ride, delivered digitally after the session. Capture the moment.",
  },
  {
    icon: Package,
    title: "Starter Kit",
    description:
      "Padded gel cycling liners (not rental — yours to keep for hygiene), energy gel, and a reusable eco mesh bag.",
  },
  {
    icon: Droplets,
    title: "Post-Ride Recovery",
    description:
      "Cold towels, electrolyte drinks, and a healthy recovery snack. Finish your ride feeling taken care of.",
  },
  {
    icon: HeartPulse,
    title: "Safety Briefing & Protocols",
    description:
      "15-minute orientation covering hand signals, lane rules, pacing, and SOS procedures before every ride.",
  },
  {
    icon: Wind,
    title: "Weather Monitoring",
    description:
      "We track conditions for your ride window and proactively communicate via LINE if plans need to change.",
  },
  {
    icon: Shirt,
    title: "Ready-to-Ride Guidance",
    description:
      "Pre-ride checklist shared in advance: closed-toe shoes, athletic socks, sun protection, and helmet required.",
  },
];

export function WhatsIncluded() {
  return (
    <section className="py-24 lg:py-32 bg-surface">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          badge="What's Included"
          title="Everything you need, nothing you don't"
          subtitle="Every ride comes fully supported. Leaders, safety, photography, starter kit, and recovery — all built in."
        />

        {/* Photo row — real equipment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4"
        >
          {[
            { src: "/images/team-uniform.jpg", alt: "LKB team uniform" },
            { src: "/images/branded-bag.jpg", alt: "En-Joy Speed branded bag" },
            { src: "/images/energy-gel.jpg", alt: "Energy gel starter kit" },
            { src: "/images/cycling-gloves.jpg", alt: "Cycling gear" },
          ].map((img, i) => (
            <motion.div
              key={img.src}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative aspect-square rounded-2xl overflow-hidden"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 25vw"
              />
            </motion.div>
          ))}
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {included.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              className="group"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/8 border border-accent/10 mb-4 transition-colors group-hover:bg-accent/15">
                <item.icon className="h-5 w-5 text-accent" />
              </div>
              <h4 className="text-base font-bold text-ink mb-1.5">
                {item.title}
              </h4>
              <p className="text-sm text-ink-muted leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bike rental note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center p-6 rounded-2xl bg-cream border border-sand/60"
        >
          <p className="text-sm font-semibold text-ink mb-1">
            Bike rental available separately
          </p>
          <p className="text-sm text-ink-muted">
            Hybrid 420 THB &middot; Road 700 THB &middot; Or bring your own at no extra cost
          </p>
        </motion.div>
      </div>
    </section>
  );
}
