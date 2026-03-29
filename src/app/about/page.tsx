import { Badge } from "@/components/ui/Badge";
import { TeamSection } from "@/components/about/TeamSection";
import { getSiteImageSettingsBatch } from "@/lib/actions/site-images";
import type { SiteImageData } from "@/lib/site-images-context";
import { FAQ } from "@/components/home/FAQ";
import { CTASection } from "@/components/home/CTASection";
import Image from "next/image";
import { getTranslation, type Locale, messages } from "@/lib/i18n";
import { getSkylaneEmbedUrl } from "@/lib/google-maps";
import { headers } from "next/headers";
import {
  Shield,
  Heart,
  Bike,
  Sun,
  Users,
  Camera,
  Award,
  Zap,
  Package,
  Droplets,
  HeartPulse,
  Wind,
  Shirt,
  MapPin,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { SkylaneCarousel } from "@/components/about/SkylaneCarousel";
import { getSkylanePhotos } from "@/lib/actions/places-photos";

export const metadata = {
  title: "About | En-Joy Speed",
  description:
    "Learn about En-Joy Speed — Bangkok's premium guided cycling experience on the Skylane.",
};

// Icons for the values and inclusions sections (order must match JSON arrays)
const VALUE_ICONS = [Shield, Heart, Bike, Sun];
const INCLUSION_ICONS = [Users, Shield, Camera, Package, Droplets, HeartPulse, Wind, Shirt];
const INCLUSION_KEYS = [
  "athleteLeaders", "heroRiders", "professionalPhotography", "starterKit",
  "postRideRecovery", "safetyBriefing", "weatherMonitoring", "readyToRideGuidance",
];

export default async function AboutPage() {
  const headersList = await headers();
  const locale = (headersList.get('x-locale') ?? 'en') as Locale;
  const t = (key: string) => getTranslation(locale, key);
  // For array values, access the locale dict directly (getTranslation only resolves strings)
  const dict = messages[locale] as Record<string, Record<string, unknown>>;

  const embedUrl = getSkylaneEmbedUrl({ zoom: 15 });
  const skylanePhotos = await getSkylanePhotos();

  const imageKeys = ["team-pailin-profile", "team-udorn-profile", "team-group-photo", "venue-meeting-point"];
  const imageBatch = await getSiteImageSettingsBatch(imageKeys);
  const imageOverrides = Object.fromEntries(
    Object.entries(imageBatch).map(([key, img]) => [key, {
      url: img.current_url,
      objectPosition: img.object_position,
      brightness: img.brightness,
      contrast: img.contrast,
      saturate: img.saturate,
    }])
  );

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-cream">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <Badge variant="accent">{t('about.aboutUs')}</Badge>
          <h1 className="mt-4">
            {t('about.letUsHandleTheSpeed')}
          </h1>
          <p className="mt-4 text-lg text-ink-muted max-w-2xl mx-auto">
            {t('about.aboutDescription')}
          </p>
        </div>
      </section>

      {/* Values — compact horizontal strip */}
      <section className="py-16 bg-surface border-b border-sand/40">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {((dict.about?.values as Array<{title: string; text: string}>) ?? []).map((v, i) => {
              const Icon = VALUE_ICONS[i] ?? Shield;
              return (
              <div key={v.title} className="flex gap-3">
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-accent/8 border border-accent/10">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">{v.title}</h3>
                  <p className="mt-0.5 text-sm text-ink-muted leading-relaxed">
                    {v.text}
                  </p>
                </div>
              </div>
            );})}
          </div>
        </div>
      </section>

      {/* How We Ride — timeline-style */}
      <section className="py-20 bg-cream">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="sky">{t('about.howWeRide')}</Badge>
            <h2 className="mt-4">{t('about.aStructuredSupportedExperience')}</h2>
            <p className="mt-3 text-ink-muted max-w-lg mx-auto">
              {t('about.everyRideFollowsSameFormat')}
            </p>
          </div>

          <ol className="space-y-6">
            {[
              {
                stepKey: "about.beforeTheRide",
                itemsKey: "beforeItems",
              },
              {
                stepKey: "about.duringTheRide",
                itemsKey: "duringItems",
              },
              {
                stepKey: "about.afterTheRide",
                itemsKey: "afterItems",
              },
            ].map((phase) => {
              const step = t(phase.stepKey);
              const items = (dict.about?.[phase.itemsKey] as string[]) ?? [];
              return (
              <li key={step} className="bg-white rounded-2xl border border-sand/40 p-6 lg:p-8">
                <h3 className="font-bold text-lg text-ink mb-3">{step}</h3>
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li key={item} className="flex gap-2.5 text-base text-ink-muted">
                      <Zap className="h-4 w-4 text-accent flex-shrink-0 mt-1" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </li>
            );
            })}
          </ol>
        </div>
      </section>

      {/* What's Included — full detail (relocated from homepage) */}
      <section id="inclusions" className="py-20 bg-surface">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="accent">{t('about.inclusions')}</Badge>
            <h2 className="mt-4">{t('about.inclusionSubtitle')}</h2>
            <p className="mt-3 text-ink-muted max-w-lg mx-auto">
              {t('about.noAddOnsNorSurprises')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {INCLUSION_KEYS.map((key, i) => {
              const Icon = INCLUSION_ICONS[i] ?? Shield;
              const inc = dict.about?.[key] as {title: string; description: string} | undefined;
              return (
              <div
                key={key}
                className="flex gap-4 p-5 rounded-xl bg-white border border-sand/40"
              >
                <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-lg bg-accent/8 border border-accent/10">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-ink">{inc?.title ?? key}</h4>
                  <p className="text-sm text-ink-muted leading-relaxed mt-0.5">
                    {inc?.description ?? ''}
                  </p>
                </div>
              </div>
            );})}
          </div>

          {/* Bike rental callout */}
          <div className="mt-8 text-center p-5 rounded-xl bg-cream border border-sand/40">
            <p className="text-base font-semibold text-ink mb-1">
              {t('about.bikeRental')}
            </p>
            <p className="text-sm text-ink-muted">
              {t('about.hybrid')} &middot; {t('about.road')} &middot; {t('about.bringYourOwn')}
            </p>
            <p className="text-xs text-ink-muted mt-2">
              {t('about.rentalNote')}
            </p>
          </div>
        </div>
      </section>

      {/* Meet the Team */}
      <TeamSection imageOverrides={imageOverrides} />

      {/* Safety */}
      <section id="safety" className="py-20 bg-surface">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge variant="accent">{t('about.safety')}</Badge>
            <h2 className="mt-4">{t('about.yourSafetyIsNonNegotiable')}</h2>
          </div>
          <div className="bg-cream rounded-2xl border border-sand/60 p-8 space-y-4">
            {((dict.about?.safetyRules as string[]) ?? []).map((rule, i) => (
              <div key={i} className="flex gap-3">
                <Shield className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-base text-ink-light leading-relaxed">{rule}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meeting Point */}
      <section id="meeting-point" className="py-20 bg-cream">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge variant="sky">{t('about.meetingPoint')}</Badge>
            <h2 className="mt-4">{t('about.whereToMeetUs')}</h2>
            <p className="mt-3 text-ink-muted max-w-lg mx-auto">
              {t('about.meetingDescription')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-sand/40">
              {(() => {
                const img = imageOverrides["venue-meeting-point"] as SiteImageData | undefined;
                const src = img?.url || "/images/venue/meeting-point.jpg";
                const hasFilters = img && ((img.brightness && img.brightness !== 1) || (img.contrast && img.contrast !== 1) || (img.saturate && img.saturate !== 1));
                return (
                  <Image
                    src={src}
                    alt={t('about.meetingPointAlt')}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    style={{
                      objectPosition: img?.objectPosition || "50% 50%",
                      ...(hasFilters ? { filter: `brightness(${img?.brightness ?? 1}) contrast(${img?.contrast ?? 1}) saturate(${img?.saturate ?? 1})` } : {}),
                    }}
                  />
                );
              })()}
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <MapPin className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-ink">{t('about.skylaneLocation')}</p>
                  <p className="text-sm text-ink-muted mt-1">
                    {t('about.skylaneDesc')}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-ink">{t('about.parkingLocation')}</p>
                  <p className="text-sm text-ink-muted mt-1">
                    {t('about.parkingDesc')}
                  </p>
                </div>
              </div>
              <a
                href="https://maps.google.com/?q=Skylane+Happy+Healthy+Bike+Lane+Suvarnabhumi"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-accent/10 text-accent-dark px-5 py-2.5 text-sm font-semibold hover:bg-accent/20 transition-colors"
              >
                {t('about.openInGoogleMaps')}
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Skylane Photo Carousel — Google Places (New) API with static fallback */}
          <div className="mt-8">
            <SkylaneCarousel placePhotos={skylanePhotos} />
          </div>

          {/* Google Maps Embed API — interactive place view */}
          {embedUrl && (
            <div className="mt-8">
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-sand/40">
                <iframe
                  src={embedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Skylane Cycling Track Location"
                  className="absolute inset-0 w-full h-full"
                />
              </div>
              <div className="mt-3 text-center">
                <a href="https://maps.google.com/?q=Skylane+Happy+Healthy+Bike+Lane+Suvarnabhumi" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent-dark transition-colors">
                  <MapPin className="h-4 w-4" />
                  View Skylane on Google Maps
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Quick book CTA between safety and FAQ */}
      <section className="py-12 bg-surface border-y border-sand/40">
        <div className="mx-auto max-w-2xl px-6 lg:px-8 text-center">
          <p className="text-lg font-bold text-ink mb-2">{t('about.readyToRide')}</p>
          <p className="text-sm text-ink-muted mb-5">
            {t('about.pickADate')}
          </p>
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold text-white hover:bg-accent-light transition-colors"
          >
            {t('about.bookARide')}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <FAQ />
      <CTASection />
    </>
  );
}
