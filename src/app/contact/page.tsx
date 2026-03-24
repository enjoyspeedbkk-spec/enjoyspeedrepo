import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { MessageCircle, Mail, MapPin, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact | En-Joy Speed",
  description:
    "Get in touch with En-Joy Speed. Reach us via LINE, email, or visit us at Skylane, Suvarnabhumi.",
};

const contactMethods = [
  {
    icon: MessageCircle,
    title: "LINE Official",
    value: "@691gsvky",
    href: "https://line.me/ti/p/@691gsvky",
    desc: "Fastest way to reach us. Typically replies within 30 minutes during business hours.",
    external: true,
  },
  {
    icon: Mail,
    title: "Email",
    value: "support@enjoyspeedbkk.com",
    href: "mailto:support@enjoyspeedbkk.com",
    desc: "For booking inquiries, partnerships, or general questions. We reply within 24 hours.",
    external: false,
  },
  {
    icon: MapPin,
    title: "Ride Location",
    value: "Skylane, Suvarnabhumi",
    href: "https://maps.app.goo.gl/skylane",
    desc: "Bangkok's elevated cycling track near Suvarnabhumi Airport. Meet-up point shared before your ride.",
    external: true,
  },
  {
    icon: Clock,
    title: "Operating Hours",
    value: "Daily 5:00 AM — 8:00 AM",
    href: null,
    desc: "We ride during golden hour and blue hour for the best experience and cooler temperatures.",
    external: false,
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-cream pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="accent">Get in Touch</Badge>
          <h1 className="mt-4 text-3xl lg:text-4xl font-bold">
            We&apos;d love to hear from you
          </h1>
          <p className="mt-2 text-ink-muted max-w-lg mx-auto">
            Whether you have a question about rides, pricing, or anything else —
            our team is ready to help.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {contactMethods.map((method) => {
            const Icon = method.icon;
            const inner = (
              <Card padding="md" hover={!!method.href} key={method.title}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-ink">{method.title}</h3>
                    <p className="text-accent font-semibold text-sm mt-0.5">
                      {method.value}
                    </p>
                    <p className="text-xs text-ink-muted mt-1.5 leading-relaxed">
                      {method.desc}
                    </p>
                  </div>
                </div>
              </Card>
            );

            if (method.href) {
              return (
                <Link
                  key={method.title}
                  href={method.href}
                  target={method.external ? "_blank" : undefined}
                  rel={method.external ? "noopener noreferrer" : undefined}
                  className="block"
                >
                  {inner}
                </Link>
              );
            }
            return <div key={method.title}>{inner}</div>;
          })}
        </div>

        {/* FAQ callout */}
        <div className="mt-10 p-5 rounded-2xl bg-gradient-to-r from-accent/5 to-sky/5 border border-accent/20 text-center">
          <p className="font-semibold text-sm">Looking for quick answers?</p>
          <p className="text-xs text-ink-muted mt-1 mb-3">
            Check out our FAQ — it covers cancellations, weather policies, what
            to bring, and more.
          </p>
          <Link
            href="/about#faq"
            className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:text-accent-dark transition-colors"
          >
            View FAQ →
          </Link>
        </div>
      </div>
    </main>
  );
}
