import Link from "next/link";
import Image from "next/image";

const footerLinks = {
  rides: [
    { label: "Duo Ride", href: "/packages#duo" },
    { label: "The Squad", href: "/packages#squad" },
    { label: "The Peloton", href: "/packages#peloton" },
    { label: "Book a Ride", href: "/booking" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Our Leaders", href: "/about#leaders" },
    { label: "Safety", href: "/about#safety" },
    { label: "FAQ", href: "/about#faq" },
  ],
  support: [
    { label: "Contact", href: "/contact" },
    { label: "LINE @EnjoySpeed", href: "https://line.me/ti/p/@EnjoySpeed" },
    { label: "Cancellation Policy", href: "/about#cancellation" },
    { label: "Weather Policy", href: "/about#weather" },
  ],
};

export function Footer() {
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
                alt="En-Joy Speed"
                width={40}
                height={40}
                className="rounded-lg brightness-110"
              />
              <div className="flex flex-col leading-none">
                <span className="font-heading text-base font-bold text-cream">
                  en-joy
                </span>
                <span className="font-heading text-xs font-semibold tracking-widest text-cream/50 uppercase">
                  speed
                </span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-cream/50 max-w-xs">
              Let us handle the speed. You enjoy the ride. Premium guided
              cycling experiences on Bangkok&apos;s Skylane.
            </p>
          </div>

          {/* Rides */}
          <div>
            <h4 className="font-heading text-sm font-semibold text-cream mb-4 uppercase tracking-wider">
              Rides
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.rides.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream/50 hover:text-cream transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-heading text-sm font-semibold text-cream mb-4 uppercase tracking-wider">
              Company
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream/50 hover:text-cream transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-heading text-sm font-semibold text-cream mb-4 uppercase tracking-wider">
              Support
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream/50 hover:text-cream transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-cream/10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-cream/30">
            &copy; {new Date().getFullYear()} En-Joy Speed. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-xs text-cream/30 hover:text-cream/60 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-cream/30 hover:text-cream/60 transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
