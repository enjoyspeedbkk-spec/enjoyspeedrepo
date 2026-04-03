"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Users, Star, Zap, Crown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { LiveConfig } from "@/lib/actions/config";

// Static display metadata — prices come from liveConfig prop
const PACKAGE_META: Record<string, { nameKey: string; taglineKey: string; supportKey: string; descriptionKey: string; icon: typeof Star; color: string; popular: boolean }> = {
  duo: { nameKey: "packages.duo.name", taglineKey: "packages.duo.tagline", supportKey: "packages.duo.support", descriptionKey: "packages.duo.description", icon: Star, color: "sky", popular: false },
  squad: { nameKey: "packages.squad.name", taglineKey: "packages.squad.tagline", supportKey: "packages.squad.support", descriptionKey: "packages.squad.description", icon: Zap, color: "accent", popular: true },
  peloton: { nameKey: "packages.peloton.name", taglineKey: "packages.peloton.tagline", supportKey: "packages.peloton.support", descriptionKey: "packages.peloton.description", icon: Crown, color: "leaf", popular: false },
};

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

export function RidePackages({ liveConfig }: { liveConfig?: LiveConfig }) {
  const { t } = useLanguage();

  // Build packages array from live DB data (with fallback)
  const packages = (liveConfig?.packages ?? []).map((p) => {
    const meta = PACKAGE_META[p.type] || PACKAGE_META.duo;
    return { ...meta, slug: p.type, price: p.pricePerPerson, minRiders: p.minRiders, maxRiders: p.maxRiders };
  });

  // Fallback if no live data
  if (packages.length === 0) {
    packages.push(
      { ...PACKAGE_META.duo, slug: "duo", price: 2500, minRiders: 2, maxRiders: 2 },
      { ...PACKAGE_META.squad, slug: "squad", price: 2100, minRiders: 3, maxRiders: 5 },
      { ...PACKAGE_META.peloton, slug: "peloton", price: 2000, minRiders: 6, maxRiders: 8 },
    );
  }

  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          badge={t('packages.rideFormats')}
          title={t('packages.chooseYourRide')}
          subtitle={t('packages.formatDescription')}
        />

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {packages.map((pkg, i) => {
            const colors = colorMap[pkg.color];
            return (
              <motion.div
                key={pkg.slug}
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
                        <span className="inline-flex items-center px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-accent text-white shadow-md whitespace-nowrap">
                          {t('packages.squad.popular')}
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
                        <h3 className="text-xl font-bold">{t(pkg.nameKey)}</h3>
                        <p className="text-sm text-ink-muted mt-0.5">
                          {t(pkg.taglineKey)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-ink-muted">
                        <Users className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {t(`packages.${pkg.slug}.riders`)}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-ink-muted leading-relaxed flex-1">
                      {t(pkg.descriptionKey)}
                    </p>

                    {/* Support */}
                    <div className={`mt-6 rounded-xl ${colors.bg} border ${colors.border} px-4 py-3`}>
                      <p className="text-sm font-semibold text-ink">
                        {t(pkg.supportKey)}
                      </p>
                      <p className="text-xs text-ink-muted mt-0.5">
                        {t('packages.photographyIncluded')}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="mt-6 pt-6 border-t border-sand/60">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-ink">
                          {pkg.price.toLocaleString()}
                        </span>
                        <span className="text-sm text-ink-muted">
                          THB {t('hero.perPerson')}
                        </span>
                      </div>
                      {pkg.minRiders === pkg.maxRiders ? (
                        <p className="text-xs text-ink-muted mt-1">
                          {(pkg.price * pkg.minRiders).toLocaleString()} THB {t('packages.for')} {pkg.minRiders} {t('packages.riders')}
                        </p>
                      ) : (
                        <p className="text-xs text-ink-muted mt-1">
                          {pkg.minRiders} {t('packages.riders')} = {(pkg.price * pkg.minRiders).toLocaleString()} THB {t('packages.separator')} {pkg.maxRiders} {t('packages.riders')} = {(pkg.price * pkg.maxRiders).toLocaleString()} THB
                        </p>
                      )}
                      <p className="text-xs text-ink-muted/70 mt-1">
                        {t('packages.bikeRental')}
                      </p>
                    </div>

                    {/* CTA */}
                    <div
                      className={`mt-6 flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all duration-300 ${
                        pkg.popular
                          ? "bg-ink text-cream group-hover:bg-ink-light shadow-sm"
                          : "bg-sand/50 text-ink group-hover:bg-sand"
                      }`}
                    >
                      {t('packages.bookNow', { name: t(pkg.nameKey) })}
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
