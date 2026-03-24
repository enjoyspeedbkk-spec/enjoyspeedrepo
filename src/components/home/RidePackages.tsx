"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Users, Star, Zap, Crown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";

const packages = [
  {
    name: "Duo",
    slug: "duo",
    tagline: "The perfect pair",
    riders: "2 riders",
    icon: Star,
    price: 2500,
    priceLabel: "per person",
    total: "5,000 THB total",
    support: "1 Athlete Leader",
    description:
      "Perfect for couples or friends who want a personal guided experience.",
    color: "sky",
    popular: false,
  },
  {
    name: "The Squad",
    slug: "squad",
    tagline: "Ride with your crew",
    riders: "3–5 riders",
    icon: Zap,
    price: 2100,
    priceLabel: "per person",
    total: "6,300–10,500 THB",
    support: "1 Leader + 1 Hero",
    description:
      "Our most popular format. Leader up front, Hero rider keeping everyone safe.",
    color: "accent",
    popular: true,
  },
  {
    name: "The Peloton",
    slug: "peloton",
    tagline: "Maximum energy",
    riders: "6–8 riders",
    icon: Crown,
    price: 2000,
    priceLabel: "per person",
    total: "12,000–16,000 THB",
    support: "2 Leaders + 2 Heroes",
    description:
      "Maximum support, maximum energy. The full experience.",
    color: "leaf",
    popular: false,
  },
];

const colorMap: Record<string, { bg: string; border: string; iconBg: string; text: string }> = {
  sky: {
    bg: "bg-sky/5",
    border: "border-sky/20",
    iconBg: "bg-sky/10",
    text: "text-sky-dark",
  },
  accent: {
    bg: "bg-accent/5",
    border: "border-accent/20",
    iconBg: "bg-accent/10",
    text: "text-accent-dark",
  },
  leaf: {
    bg: "bg-leaf/5",
    border: "border-leaf/20",
    iconBg: "bg-leaf/10",
    text: "text-leaf",
  },
};

export function RidePackages() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          badge="Ride Formats"
          title="Choose your ride style"
          subtitle="Three curated formats designed for different group sizes. Every ride includes an Athlete Leader, Hero support riders, and photography."
        />

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {packages.map((pkg, i) => {
            const colors = colorMap[pkg.color];
            return (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <Link
                  href={`/booking?package=${pkg.slug}`}
                  className="block h-full group"
                >
                  <Card
                    hover
                    padding="lg"
                    className={`relative h-full flex flex-col overflow-visible ${
                      pkg.popular ? "border-accent/30 shadow-md ring-1 ring-accent/10" : ""
                    }`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                        <span className="inline-flex items-center px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-accent text-white shadow-md whitespace-nowrap">
                          Most Popular
                        </span>
                      </div>
                    )}

                    {/* Icon + Name */}
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div
                          className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${colors.iconBg} mb-3`}
                        >
                          <pkg.icon className={`h-5 w-5 ${colors.text}`} />
                        </div>
                        <h3 className="text-xl font-bold">{pkg.name}</h3>
                        <p className="text-sm text-ink-muted mt-0.5">
                          {pkg.tagline}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-ink-muted">
                        <Users className="h-4 w-4" />
                        <span className="text-sm font-medium">{pkg.riders}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-ink-muted leading-relaxed flex-1">
                      {pkg.description}
                    </p>

                    {/* Support */}
                    <div className={`mt-6 rounded-xl ${colors.bg} border ${colors.border} px-4 py-3`}>
                      <p className="text-sm font-semibold text-ink">
                        {pkg.support}
                      </p>
                      <p className="text-xs text-ink-muted mt-0.5">
                        Photography included
                      </p>
                    </div>

                    {/* Price */}
                    <div className="mt-6 pt-6 border-t border-sand/60">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-ink">
                          {pkg.price.toLocaleString()}
                        </span>
                        <span className="text-sm text-ink-muted">
                          THB {pkg.priceLabel}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted mt-1">{pkg.total}</p>
                    </div>

                    {/* CTA */}
                    <div
                      className={`mt-6 flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all duration-300 ${
                        pkg.popular
                          ? "bg-ink text-cream group-hover:bg-ink-light shadow-sm"
                          : "bg-sand/50 text-ink group-hover:bg-sand"
                      }`}
                    >
                      Book {pkg.name}
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
