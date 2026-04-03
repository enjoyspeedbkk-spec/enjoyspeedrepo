"use client";

import { motion } from "framer-motion";
import { Sunrise, Sunset, Clock, MapPin } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { SiteImage } from "@/lib/site-images-context";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { LiveConfig } from "@/lib/config-types";

// Mood/vibe keys are display-only i18n — keyed by slot ID
const SLOT_I18N: Record<string, { labelKey: string; moodKey: string; vibeKey: string }> = {
  A1: { labelKey: "timeSlots.earlyBird.label", moodKey: "timeSlots.earlyBird.mood", vibeKey: "timeSlots.earlyBird.vibe" },
  A2: { labelKey: "timeSlots.energyBooster.label", moodKey: "timeSlots.energyBooster.mood", vibeKey: "timeSlots.energyBooster.vibe" },
  B: { labelKey: "timeSlots.lightChaser.label", moodKey: "timeSlots.lightChaser.mood", vibeKey: "timeSlots.lightChaser.vibe" },
  C: { labelKey: "timeSlots.goldenHour.label", moodKey: "timeSlots.goldenHour.mood", vibeKey: "timeSlots.goldenHour.vibe" },
  D: { labelKey: "timeSlots.twilightFinish.label", moodKey: "timeSlots.twilightFinish.mood", vibeKey: "timeSlots.twilightFinish.vibe" },
};

// Fallback if DB is empty
const FALLBACK_SLOTS = [
  { id: "A1", startTime: "06:15", endTime: "08:15", period: "morning" },
  { id: "A2", startTime: "06:30", endTime: "08:30", period: "morning" },
  { id: "B", startTime: "16:15", endTime: "18:15", period: "evening" },
  { id: "C", startTime: "16:45", endTime: "18:45", period: "evening" },
  { id: "D", startTime: "17:15", endTime: "19:15", period: "evening" },
];

export function TimeSlots({ liveConfig }: { liveConfig?: LiveConfig }) {
  const { t } = useLanguage();

  const rawSlots = liveConfig?.timeSlots?.length ? liveConfig.timeSlots : FALLBACK_SLOTS;
  const slots = rawSlots.map((s) => {
    const i18n = SLOT_I18N[s.id] || { labelKey: `timeSlots.${s.id}.label`, moodKey: `timeSlots.${s.id}.mood`, vibeKey: `timeSlots.${s.id}.vibe` };
    return {
      id: s.id,
      time: `${s.startTime} — ${s.endTime}`,
      period: s.period as "morning" | "evening",
      staffPick: s.id === "C",
      ...i18n,
    };
  });

  const morningSlots = slots.filter((s) => s.period === "morning");
  const eveningSlots = slots.filter((s) => s.period === "evening");

  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          badge={t('timeSlots.sessionTimes')}
          title={t('timeSlots.rideWhenItFeelsRight')}
          subtitle={t('timeSlots.morningAndEvening')}
        />

        {/* Route photo strip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-12 rounded-2xl overflow-hidden h-36 lg:h-48 relative"
        >
          <SiteImage
            imageKey="venue-group-ride"
            fallback="/images/group-ride.jpg"
            alt="Group ride on the Skylane at sunset"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/50 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">
                {t('timeSlots.rideLocation')}
              </p>
              <p className="text-white text-lg font-bold mt-0.5">
                {t('timeSlots.routeDetails')}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-white/70 text-sm">
              <MapPin className="h-4 w-4" />
              {t('timeSlots.bangkok')}
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
              <h3 className="text-lg font-bold">{t('timeSlots.morningSessionsHeader')}</h3>
              <p className="text-sm text-ink-muted">
                {t('timeSlots.morningDesc')}
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
                <Card padding="md" className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs font-bold text-sky bg-sky/10 px-2 py-0.5 rounded-full">
                        {t('timeSlots.slotInfo', { id: slot.id })}
                      </span>
                      <h4 className="text-base font-bold mt-2">{t(slot.labelKey)}</h4>
                    </div>
                    <span className="text-xs font-medium text-ink-muted bg-sand/50 px-2.5 py-1 rounded-full">
                      {t(slot.vibeKey)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-ink mb-2">
                    <Clock className="h-3.5 w-3.5 text-ink-muted" />
                    {slot.time}
                  </div>
                  <p className="text-sm text-ink-muted leading-relaxed flex-1">
                    {t(slot.moodKey)}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Evening */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10">
              <Sunset className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{t('timeSlots.eveningSessionsHeader')}</h3>
              <p className="text-sm text-ink-muted">
                {t('timeSlots.eveningDesc')}
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
                <Card padding="md" className={`flex flex-col h-full ${slot.staffPick ? "ring-1 ring-accent/20 border-accent/30" : ""}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                        {t('timeSlots.slotInfo', { id: slot.id })}
                      </span>
                      <h4 className="text-base font-bold mt-2">{t(slot.labelKey)}</h4>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      slot.staffPick
                        ? "text-accent-dark bg-accent/10 font-bold"
                        : "text-ink-muted bg-sand/50"
                    }`}>
                      {t(slot.vibeKey)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-ink mb-2">
                    <Clock className="h-3.5 w-3.5 text-ink-muted" />
                    {slot.time}
                  </div>
                  <p className="text-sm text-ink-muted leading-relaxed flex-1">
                    {t(slot.moodKey)}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
