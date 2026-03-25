"use client";

import { motion } from "framer-motion";
import {
  CalendarDays,
  CreditCard,
  MessageCircle,
  Bike,
  Camera,
  Heart,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const steps = [
  {
    number: "01",
    icon: CalendarDays,
    titleKey: "howItWorks.step1.title",
    descriptionKey: "howItWorks.step1.description",
  },
  {
    number: "02",
    icon: CreditCard,
    titleKey: "howItWorks.step2.title",
    descriptionKey: "howItWorks.step2.description",
  },
  {
    number: "03",
    icon: MessageCircle,
    titleKey: "howItWorks.step3.title",
    descriptionKey: "howItWorks.step3.description",
  },
  {
    number: "04",
    icon: Bike,
    titleKey: "howItWorks.step4.title",
    descriptionKey: "howItWorks.step4.description",
  },
  {
    number: "05",
    icon: Camera,
    titleKey: "howItWorks.step5.title",
    descriptionKey: "howItWorks.step5.description",
  },
  {
    number: "06",
    icon: Heart,
    titleKey: "howItWorks.step6.title",
    descriptionKey: "howItWorks.step6.description",
  },
];

export function HowItWorks() {
  const { t } = useLanguage();

  return (
    <section className="py-24 lg:py-32 bg-surface">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          badge={t('howItWorks.theExperience')}
          title={t('howItWorks.fromBookingToRecovery')}
          subtitle={t('howItWorks.subtitle')}
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="relative rounded-2xl border border-sand/40 bg-white p-6 hover:border-accent/20 hover:shadow-sm transition-all duration-300"
            >
              {/* Top row: icon + step number */}
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-accent/8 border border-accent/10">
                  <step.icon className="h-5 w-5 text-accent" />
                </div>
                <span className="text-3xl font-bold text-sand/50 font-heading select-none">
                  {step.number}
                </span>
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-ink">{t(step.titleKey)}</h3>
              <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                {t(step.descriptionKey)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
