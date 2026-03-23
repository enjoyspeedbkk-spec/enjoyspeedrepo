import { Badge } from "@/components/ui/Badge";
import { FAQ } from "@/components/home/FAQ";
import { CTASection } from "@/components/home/CTASection";
import {
  Shield,
  Heart,
  Bike,
  Sun,
  Users,
  Camera,
  Award,
  Zap,
} from "lucide-react";

export const metadata = {
  title: "About | En-Joy Speed",
  description:
    "Learn about En-Joy Speed — Bangkok's premium guided cycling experience on the Skylane.",
};

const values = [
  {
    icon: Shield,
    title: "Safety First",
    text: "Every ride follows strict safety protocols. Helmets required, conduct briefings given, and our Leaders have authority to ensure everyone stays safe.",
  },
  {
    icon: Heart,
    title: "Experience Design",
    text: "From the moment you book to post-ride recovery, every touchpoint is intentional. We don't just organize rides — we craft experiences.",
  },
  {
    icon: Bike,
    title: "Operational Precision",
    text: "Structured time slots, trained Leaders and Hero riders, weather monitoring, and seamless communication. The logistics are invisible because they work.",
  },
  {
    icon: Sun,
    title: "Premium Simplicity",
    text: "Beautiful doesn't mean complicated. Our booking, rides, and recovery all follow the same principle: elegant, clear, frictionless.",
  },
];

export default function AboutPage() {
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
            Skylane. We combine athletic leadership, curated experiences, and
            operational precision to make every ride unforgettable.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-surface">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 gap-8 lg:gap-12">
            {values.map((v) => (
              <div key={v.title} className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-accent/8 border border-accent/10">
                  <v.icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-ink">{v.title}</h3>
                  <p className="mt-1.5 text-sm text-ink-muted leading-relaxed">
                    {v.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ride Structure */}
      <section className="py-20 bg-cream">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="sky">How We Ride</Badge>
            <h2 className="mt-4">A structured, supported experience</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Award, label: "Athlete Leaders", sub: "Set pace & guide route" },
              { icon: Users, label: "Hero Riders", sub: "Sweep & safety support" },
              { icon: Camera, label: "Photography", sub: "Action shots included" },
              { icon: Zap, label: "Recovery", sub: "Cool down & rehydrate" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-surface border border-sand/60"
              >
                <item.icon className="h-8 w-8 text-accent mb-3" />
                <p className="font-bold text-ink">{item.label}</p>
                <p className="text-xs text-ink-muted mt-1">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety */}
      <section id="safety" className="py-20 bg-surface">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge variant="accent">Safety</Badge>
            <h2 className="mt-4">Your safety is non-negotiable</h2>
          </div>
          <div className="bg-cream rounded-2xl border border-sand/60 p-8 space-y-4">
            {[
              "Helmets and safety gear are mandatory for all riders.",
              "Riders must confirm physical readiness for approximately 23.5 km of cycling.",
              "Personal insurance is required — the service does not include injury or damage coverage.",
              "All riders must follow instructions from Athlete Leaders at all times.",
              "Leaders have authority to terminate participation immediately if safety is compromised.",
              "A full health & safety waiver must be completed during onboarding before your ride.",
            ].map((rule, i) => (
              <div key={i} className="flex gap-3">
                <Shield className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-sm text-ink-light leading-relaxed">{rule}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FAQ />
      <CTASection />
    </>
  );
}
