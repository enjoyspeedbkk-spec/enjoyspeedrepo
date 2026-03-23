"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";

const testimonials = [
  {
    name: "Nita S.",
    role: "First-time cyclist",
    quote:
      "I was nervous about cycling 23 km but the Athlete Leaders made it feel effortless. The golden hour views were absolutely stunning.",
    rating: 5,
  },
  {
    name: "Marcus L.",
    role: "Regular rider",
    quote:
      "Best organized group ride I've ever done. The Hero support riders made sure nobody got dropped. Felt safe the whole time.",
    rating: 5,
  },
  {
    name: "Ploy & Tong",
    role: "Duo ride",
    quote:
      "We booked for our anniversary. The photos they took were incredible — professional quality. The starter kit was a lovely touch.",
    rating: 5,
  },
  {
    name: "David K.",
    role: "Visiting from Singapore",
    quote:
      "Didn't know the Skylane existed until a friend told me about En-Joy Speed. Now it's my must-do every time I visit Bangkok.",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-20 lg:py-28 bg-cream">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          badge="Riders Love Us"
          title="Don't just take our word for it"
          subtitle="Hear from riders who've experienced the Skylane with us."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Card padding="md" className="h-full flex flex-col">
                <Quote className="h-5 w-5 text-accent/30 mb-3 flex-shrink-0" />
                <p className="text-sm text-ink-light leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-4 pt-3 border-t border-sand/40">
                  <div className="flex gap-0.5 mb-1.5">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star
                        key={j}
                        className="h-3.5 w-3.5 fill-accent text-accent"
                      />
                    ))}
                  </div>
                  <p className="text-sm font-semibold text-ink">{t.name}</p>
                  <p className="text-xs text-ink-muted">{t.role}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
