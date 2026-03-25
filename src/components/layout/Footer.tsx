"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type FooterLink = { label: string; href: string; external?: boolean; i18nKey?: string };

const getFooterLinks = (t: any): Record<string, FooterLink[]> => ({
  rides: [
    { label: t('footer.duoRide'), href: "/packages#duo", i18nKey: 'footer.duoRide' },
    { label: t('footer.theSquad'), href: "/packages#squad", i18nKey: 'footer.theSquad' },
    { label: t('footer.thePeloton'), href: "/packages#peloton", i18nKey: 'footer.thePeloton' },
    { label: t('footer.bookARide'), href: "/booking", i18nKey: 'footer.bookARide' },
  ],
  company: [
    { label: t('footer.aboutUs'), href: "/about", i18nKey: 'footer.aboutUs' },
    { label: t('footer.ourLeaders'), href: "/about#leaders", i18nKey: 'footer.ourLeaders' },
    { label: t('footer.safety'), href: "/about#safety", i18nKey: 'footer.safety' },
    { label: t('footer.faq'), href: "/about#faq", i18nKey: 'footer.faq' },
  ],
  support: [
    { label: t('footer.contact'), href: "/contact", i18nKey: 'footer.contact' },
    { label: t('footer.lineOfficialAccount'), href: "https://line.me/ti/p/@691gsvky", external: true, i18nKey: 'footer.lineOfficialAccount' },
    { label: t('footer.cancellationPolicy'), href: "/about#cancellation", i18nKey: 'footer.cancellationPolicy' },
    { label: t('footer.weatherPolicy'), href: "/about#weather", i18nKey: 'footer.weatherPolicy' },
  ],
});

function FooterLink({ link }: { link: FooterLink }) {
  const className = "text-sm text-cream/70 hover:text-cream transition-colors duration-200";
  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
        {link.label}
      </a>
    );
  }
  return (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  );
}

export function Footer() {
  const { t } = useLanguage();
  const footerLinks = getFooterLinks(t);

  return (
    <footer className="bg-ink text-cream/70">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Main Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 py-16 lg:py-20">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <Image
                src="/images/logo.jpg"
                alt={t('common.appName')}
                width={40}
                height={40}
                className="rounded-lg brightness-110"
              />
              <div className="flex flex-col leading-none">
                <span className="font-heading text-base font-bold text-cream">
                  en-joy
                </span>
                <span className="font-heading text-xs font-semibold tracking-widest text-cream/70 uppercase">
                  speed
                </span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-cream/70 max-w-xs">
              {t('footer.slogan')}
            </p>
          </div>

          {/* Rides */}
          <div>
            <h4 className="font-heading text-sm font-semibold text-cream mb-4 uppercase tracking-wider">
              {t('footer.rides')}
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.rides.map((link) => (
                <li key={link.href}>
                  <FooterLink link={link} />
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-heading text-sm font-semibold text-cream mb-4 uppercase tracking-wider">
              {t('footer.company')}
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <FooterLink link={link} />
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-heading text-sm font-semibold text-cream mb-4 uppercase tracking-wider">
              {t('footer.support')}
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <FooterLink link={link} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-cream/10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-cream/50">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-xs text-cream/50 hover:text-cream transition-colors"
            >
              {t('footer.privacy')}
            </Link>
            <Link
              href="/terms"
              className="text-xs text-cream/50 hover:text-cream transition-colors"
            >
              {t('footer.terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
