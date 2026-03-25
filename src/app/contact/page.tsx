import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { MessageCircle, Mail, MapPin, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { getTranslation, type Locale } from "@/lib/i18n";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Contact | En-Joy Speed",
  description:
    "Get in touch with En-Joy Speed. Reach us via LINE, email, or visit us at Skylane, Suvarnabhumi.",
};

const getContactMethods = (t: (key: string) => string) => [
  {
    icon: MessageCircle,
    title: t('contact.lineOfficial'),
    value: t('contact.lineHandle'),
    href: "https://line.me/ti/p/@691gsvky",
    desc: t('contact.lineDesc'),
    external: true,
  },
  {
    icon: Mail,
    title: t('contact.email'),
    value: t('contact.emailAddress'),
    href: "mailto:support@enjoyspeedbkk.com",
    desc: t('contact.emailDesc'),
    external: false,
  },
  {
    icon: MapPin,
    title: t('contact.rideLocation'),
    value: t('contact.location'),
    href: "https://maps.app.goo.gl/skylane",
    desc: t('contact.locationDesc'),
    external: true,
  },
  {
    icon: Clock,
    title: t('contact.operatingHours'),
    value: t('contact.hours'),
    href: null,
    desc: t('contact.hoursDesc'),
    external: false,
  },
];

export default async function ContactPage() {
  const headersList = await headers();
  const locale = (headersList.get('x-locale') ?? 'en') as Locale;
  const t = (key: string) => getTranslation(locale, key);

  return (
    <main className="min-h-screen bg-cream pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="accent">{t('contact.getInTouch')}</Badge>
          <h1 className="mt-4 text-3xl lg:text-4xl font-bold">
            {t('contact.wedLoveToHearFromYou')}
          </h1>
          <p className="mt-2 text-ink-muted max-w-lg mx-auto">
            {t('contact.whetherYouHaveAQuestion')}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {getContactMethods(t).map((method) => {
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
          <p className="font-semibold text-sm">{t('contact.lookingForQuickAnswers')}</p>
          <p className="text-xs text-ink-muted mt-1 mb-3">
            {t('contact.checkOurFAQ')}
          </p>
          <Link
            href="/about#faq"
            className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:text-accent-dark transition-colors"
          >
            {t('contact.viewFAQ')}
          </Link>
        </div>
      </div>
    </main>
  );
}
