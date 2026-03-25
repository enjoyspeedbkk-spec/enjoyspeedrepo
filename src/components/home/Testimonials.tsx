"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function Testimonials() {
  const { t } = useLanguage();
  const testimonials = (t('testimonials.reviews') as unknown) as Array<{ name: string; role: string; quote: string }>;

  return (
    <section className="py-20 lg:py-28 bg-cream">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          badge={t('testimonials.ridersLoveUs')}
          title={t('testimonials.dontJustTakeOurWord')}
          subtitle={t('testimonials.hearFromRiders')}
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Card padding="md" className="h-full flex flex-col">
                <Quote className="h-5 w-5 text-accent/30 mb-3 flex-shrink-0" />
                <p className="text-sm text-ink-light leading-relaxed flex-1">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="mt-4 pt-3 border-t border-sand/40">
                  <div className="flex gap-0.5 mb-1.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star
                        key={j}
                        className="h-3.5 w-3.5 fill-accent text-accent"
                      />
                    ))}
                  </div>
                  <p className="text-sm font-semibold text-ink">{testimonial.name}</p>
                  <p className="text-xs text-ink-muted">{testimonial.role}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
