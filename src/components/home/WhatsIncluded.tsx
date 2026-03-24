"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Camera, Package } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";

const highlights = [
  {
    icon: Package,
    title: "Starter Kit",
    description:
      "Padded cycling liners (yours to keep), energy gel, and a reusable eco mesh bag — ready at check-in.",
  },
  {
    icon: Camera,
    title: "Ride Photography",
    description:
      "We capture action shots and group moments during your ride — delivered digitally after the session. Candid, fun memories of your experience.",
  },
];

export function WhatsIncluded() {
  return (
    <section className="py-24 lg:py-32 bg-surface">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          badge="What's Included"
          title="Everything you need, nothing you don't"
          subtitle="Every ride includes Leaders, safety support, photography, starter kit, and post-ride recovery."
        />

        {/* Two primary highlights */}
        <div className="grid sm:grid-cols-2 gap-6 lg:gap-8 mb-10">
          {highlights.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex gap-5 items-start p-6 rounded-2xl bg-white border border-sand/40"
            >
              <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-accent/8 border border-accent/10">
                <item.icon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h4 className="text-base font-bold text-ink mb-1">
                  {item.title}
                </h4>
                <p className="text-sm text-ink-muted leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Photo row — real equipment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4"
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

        {/* Bike rental note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-ink-muted mt-6"
        >
          Bike rental available separately — Hybrid 420 THB · Road 720 THB · Or bring your own.
        </motion.p>
      </div>
    </section>
  );
}
