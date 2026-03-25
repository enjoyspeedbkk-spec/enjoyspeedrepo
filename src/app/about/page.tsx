import { Badge } from "@/components/ui/Badge";
import { TeamSection } from "@/components/about/TeamSection";
import { getSiteImageSettingsBatch } from "@/lib/actions/site-images";
import type { SiteImageData } from "@/lib/site-images-context";
import { FAQ } from "@/components/home/FAQ";
import { CTASection } from "@/components/home/CTASection";
import Image from "next/image";
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

export const metadata = {
  title: "About | En-Joy Speed",
  description:
    "Learn about En-Joy Speed — Bangkok's premium guided cycling experience on the Skylane.",
};

const values = [
  {
    icon: Shield,
    title: "Safety First",
    text: "Helmets required, conduct briefings given, and our Leaders have authority to ensure everyone stays safe.",
  },
  {
    icon: Heart,
    title: "Experience Design",
    text: "From booking to post-ride recovery, every touchpoint is intentional. We craft experiences, not just rides.",
  },
  {
    icon: Bike,
    title: "Operational Precision",
    text: "Structured slots, trained Leaders, weather monitoring, and seamless communication — invisible because it works.",
  },
  {
    icon: Sun,
    title: "Premium Simplicity",
    text: "Beautiful doesn't mean complicated. Booking, rides, and recovery all follow the same principle: frictionless.",
  },
];

const inclusions = [
  {
    icon: Users,
    title: "Athlete Leaders",
    description:
      "Elite local cyclists who set the pace, guide the route, and keep the group safe. They lead from the front.",
  },
  {
    icon: Shield,
    title: "Hero Support Riders",
    description:
      "Sweep riders at the back watching over every participant. No one gets left behind.",
  },
  {
    icon: Camera,
    title: "Ride Photography",
    description:
      "We capture action shots and group moments during your ride — candid, fun memories delivered digitally after the session.",
  },
  {
    icon: Package,
    title: "Starter Kit",
    description:
      "Padded gel cycling liners (yours to keep), energy gel, and a reusable eco mesh bag.",
  },
  {
    icon: Droplets,
    title: "Post-Ride Recovery",
    description:
      "Electrolyte drinks and recovery refreshments after every ride.",
  },
  {
    icon: HeartPulse,
    title: "Safety Briefing",
    description:
      "15-minute orientation covering hand signals, lane rules, pacing, and SOS procedures.",
  },
  {
    icon: Wind,
    title: "Weather Monitoring",
    description:
      "We track conditions for your ride window and communicate proactively via LINE if plans change.",
  },
  {
    icon: Shirt,
    title: "Ready-to-Ride Guidance",
    description:
      "Pre-ride checklist shared in advance: closed-toe shoes, athletic socks, sun protection, helmet required.",
  },
];

export default async function AboutPage() {
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
          <Badge variant="accent">About Us</Badge>
          <h1 className="mt-4">
            Let us handle the speed.
            <br />
            You enjoy the ride.
          </h1>
          <p className="mt-4 text-lg text-ink-muted max-w-2xl mx-auto">
            En-Joy Speed is a premium guided cycling service on Bangkok&apos;s
            Skylane — 23.5 km of elevated track at Suvarnabhumi. Athletic
            leadership, curated experiences, operational precision.
          </p>
        </div>
      </section>

      {/* Values — compact horizontal strip */}
      <section className="py-16 bg-surface border-b border-sand/40">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div key={v.title} className="flex gap-3">
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-accent/8 border border-accent/10">
                  <v.icon className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">{v.title}</h3>
                  <p className="mt-0.5 text-sm text-ink-muted leading-relaxed">
                    {v.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How We Ride — timeline-style */}
      <section className="py-20 bg-cream">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="sky">How We Ride</Badge>
            <h2 className="mt-4">A structured, supported experience</h2>
            <p className="mt-3 text-ink-muted max-w-lg mx-auto">
              Every ride follows the same proven format — designed so you can
              focus on pedalling, not logistics.
            </p>
          </div>

          <ol className="space-y-6">
            {[
              {
                step: "Before the ride",
                items: [
                  "Safety briefing: hand signals, lane rules, pacing, SOS procedures (15 min)",
                  "Starter kit distributed: cycling liners, energy gel, mesh bag (640 THB included in ride price)",
                  "Bike check for those renting (helmet included with rental)",
                ],
              },
              {
                step: "During the ride",
                items: [
                  "Athlete Leaders set and maintain pace from the front",
                  "Hero Riders sweep the back — nobody gets left behind",
                  "We capture action shots and group moments throughout your ride",
                  "23.5 km on the elevated Skylane at Suvarnabhumi",
                ],
              },
              {
                step: "After the ride",
                items: [
                  "Electrolyte drinks and recovery refreshments",
                  "Ride photos delivered digitally",
                  "Weather updates via LINE if relevant for upcoming sessions",
                ],
              },
            ].map((phase) => (
              <li key={phase.step} className="bg-white rounded-2xl border border-sand/40 p-6 lg:p-8">
                <h3 className="font-bold text-lg text-ink mb-3">{phase.step}</h3>
                <ul className="space-y-3">
                  {phase.items.map((item) => (
                    <li key={item} className="flex gap-2.5 text-base text-ink-muted">
                      <Zap className="h-4 w-4 text-accent flex-shrink-0 mt-1" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* What's Included — full detail (relocated from homepage) */}
      <section id="inclusions" className="py-20 bg-surface">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="accent">What&apos;s Included</Badge>
            <h2 className="mt-4">Everything in every ride</h2>
            <p className="mt-3 text-ink-muted max-w-lg mx-auto">
              No add-ons, no surprises. Here&apos;s the full list of what comes
              with every booking.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {inclusions.map((item) => (
              <div
                key={item.title}
                className="flex gap-4 p-5 rounded-xl bg-white border border-sand/40"
              >
                <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-lg bg-accent/8 border border-accent/10">
                  <item.icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-ink">{item.title}</h4>
                  <p className="text-sm text-ink-muted leading-relaxed mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Bike rental callout */}
          <div className="mt-8 text-center p-5 rounded-xl bg-cream border border-sand/40">
            <p className="text-base font-semibold text-ink mb-1">
              Bike rental available separately
            </p>
            <p className="text-sm text-ink-muted">
              Hybrid 420 THB &middot; Road 720 THB &middot; Or bring your own at no extra cost
            </p>
            <p className="text-xs text-ink-muted mt-2">
              Rental is directly through HHBL (Happy and Healthy Bike Lane). We facilitate the process.
              <br />All rental bikes are professionally maintained and ready to ride. Helmet included with every rental.
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
            <Badge variant="accent">Safety</Badge>
            <h2 className="mt-4">Your safety is non-negotiable</h2>
          </div>
          <div className="bg-cream rounded-2xl border border-sand/60 p-8 space-y-4">
            {[
              "Helmets are mandatory for all riders (included with bike rental, or bring your own).",
              "Riders must confirm physical readiness for approximately 23.5 km of cycling.",
              "We recommend riders have their own personal accident insurance or travel insurance for peace of mind.",
              "All rental bikes include insurance coverage provided by the rental shop.",
              "All riders must follow instructions from Athlete Leaders at all times.",
              "Leaders have authority to terminate participation immediately if safety is compromised.",
              "A full health & safety waiver must be completed during onboarding before your ride.",
            ].map((rule, i) => (
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
            <Badge variant="sky">Meeting Point</Badge>
            <h2 className="mt-4">Where to meet us</h2>
            <p className="mt-3 text-ink-muted max-w-lg mx-auto">
              We meet at the Skylane (Happy and Healthy Bike Lane) at Suvarnabhumi.
              Look for Parking signs K and L.
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
                    alt="Meeting point — Parking sign K and L at Skylane"
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
                  <p className="font-bold text-ink">Skylane HHBL, Suvarnabhumi</p>
                  <p className="text-sm text-ink-muted mt-1">
                    Happy and Healthy Bike Lane — 23.5 km elevated cycling track
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-ink">Parking: Signs K &amp; L</p>
                  <p className="text-sm text-ink-muted mt-1">
                    Free parking available. Arrive 15 minutes early for check-in and safety briefing.
                  </p>
                </div>
              </div>
              <a
                href="https://maps.google.com/?q=Skylane+Happy+Healthy+Bike+Lane+Suvarnabhumi"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-accent/10 text-accent-dark px-5 py-2.5 text-sm font-semibold hover:bg-accent/20 transition-colors"
              >
                Open in Google Maps
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Quick book CTA between safety and FAQ */}
      <section className="py-12 bg-surface border-y border-sand/40">
        <div className="mx-auto max-w-2xl px-6 lg:px-8 text-center">
          <p className="text-lg font-bold text-ink mb-2">Ready to ride?</p>
          <p className="text-sm text-ink-muted mb-5">
            Pick a date, choose your group size, and we handle the rest.
          </p>
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold text-white hover:bg-accent-light transition-colors"
          >
            Book a Ride
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <FAQ />
      <CTASection />
    </>
  );
}
