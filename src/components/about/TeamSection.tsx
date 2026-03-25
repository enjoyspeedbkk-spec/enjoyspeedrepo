"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Award, Shield, Heart, Star } from "lucide-react";
import type { SiteImageData } from "@/lib/site-images-context";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { messages } from "@/lib/i18n";

const CREDENTIAL_ICONS = [Award, Shield, Heart, Star];

const TEAM_IMAGES = [
  { key: "team-pailin-profile", imageKey: "pailin", fallback: "/images/team/pailin-1.jpg", nameKey: "Coach Pailin", bioKey: "about.pailinBio", specialtiesKey: "pailinSpecialties" },
  { key: "team-udorn-profile",  imageKey: "udorn",  fallback: "/images/team/udorn-1.jpg",  nameKey: "Coach Udorn",  bioKey: "about.udornBio",   specialtiesKey: "udornSpecialties" },
];

function resolveImage(overrides: Record<string, string | SiteImageData> | undefined, key: string, fallback: string) {
  const val = overrides?.[key];
  if (!val) return { src: fallback, style: {} as React.CSSProperties };
  if (typeof val === "string") return { src: val, style: {} as React.CSSProperties };
  const hasFilters = (val.brightness && val.brightness !== 1) || (val.contrast && val.contrast !== 1) || (val.saturate && val.saturate !== 1);
  return {
    src: val.url,
    style: {
      objectPosition: val.objectPosition || undefined,
      ...(hasFilters ? { filter: `brightness(${val.brightness ?? 1}) contrast(${val.contrast ?? 1}) saturate(${val.saturate ?? 1})` } : {}),
    } as React.CSSProperties,
  };
}

export function TeamSection({ imageOverrides }: { imageOverrides?: Record<string, string | SiteImageData> } = {}) {
  const { t, locale } = useLanguage();
  const dict = messages[locale] as Record<string, Record<string, unknown>>;
  const credentials = (dict.about?.credentials as Array<{label: string; sub: string}>) ?? [];
  const role = t('about.coachRole');

  return (
    <section className="py-20 lg:py-28 bg-cream overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-accent text-sm font-semibold uppercase tracking-wider mb-3">
            {t('about.yourLeaders')}
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-ink max-w-2xl mx-auto">
            {t('about.meetThePeople')}
          </h2>
          <p className="mt-4 text-ink-muted max-w-lg mx-auto">
            {t('about.leadersNotJustGuides')}
          </p>
        </motion.div>

        {/* Coach cards */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {TEAM_IMAGES.map((member, i) => {
            const bio = t(member.bioKey);
            const specialties = (dict.about?.[member.specialtiesKey] as string[]) ?? [];
            const resolved = resolveImage(imageOverrides, member.key, member.fallback);
            return (
            <motion.div
              key={member.nameKey}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className="bg-white rounded-2xl border border-sand/40 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Photo */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={resolved.src}
                  alt={`${member.nameKey} — ${role}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ objectPosition: "50% 20%", ...resolved.style }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-xl font-bold text-white">{member.nameKey}</h3>
                  <p className="text-sm text-white/80 font-medium">{role}</p>
                </div>
              </div>

              {/* Bio */}
              <div className="p-6">
                <p className="text-sm text-ink-muted leading-relaxed">{bio}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {specialties.map((s) => (
                    <span
                      key={s}
                      className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent/8 text-accent-dark border border-accent/10"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          );})}
        </div>

        {/* Team photo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <div className="relative aspect-[3/4] sm:aspect-[4/3] max-w-2xl mx-auto rounded-2xl overflow-hidden">
            {(() => {
              const resolved = resolveImage(imageOverrides, "team-group-photo", "/images/team/team-dawn.jpg");
              return (
                <Image
                  src={resolved.src}
                  alt="The En-Joy Speed team at dawn, ready to ride"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 700px"
                  style={{ objectPosition: "50% 50%", ...resolved.style }}
                />
              );
            })()}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
              <p className="text-white text-lg lg:text-xl font-bold drop-shadow-sm">
                {t('about.teamSection')}
              </p>
              <p className="text-white/90 text-sm mt-1 max-w-xl drop-shadow-sm">
                {t('about.teamDescription')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Credentials grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {credentials.map((cred, i) => {
            const Icon = CREDENTIAL_ICONS[i] ?? Award;
            return (
            <motion.div
              key={cred.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex flex-col items-center text-center p-5 rounded-xl bg-white border border-sand/40"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/8 border border-accent/10 flex items-center justify-center mb-3">
                <Icon className="h-5 w-5 text-accent" />
              </div>
              <p className="font-bold text-sm text-ink">{cred.label}</p>
              <p className="text-xs text-ink-muted mt-0.5">{cred.sub}</p>
            </motion.div>
          );})}
        </div>
      </div>
    </section>
  );
}
