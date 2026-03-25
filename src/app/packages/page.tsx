import { RidePackages } from "@/components/home/RidePackages";
import { TimeSlots } from "@/components/home/TimeSlots";
import { WhatsIncluded } from "@/components/home/WhatsIncluded";
import { CTASection } from "@/components/home/CTASection";
import { Badge } from "@/components/ui/Badge";
import { getTranslation, type Locale } from "@/lib/i18n";
import { headers } from "next/headers";

export const metadata = {
  title: "Ride Packages | En-Joy Speed",
  description:
    "Explore our ride formats: Duo, Squad, and Peloton. Premium guided cycling on Bangkok's Skylane.",
};

export default async function PackagesPage() {
  const headersList = await headers();
  const locale = (headersList.get('x-locale') ?? 'en') as Locale;
  const t = (key: string) => getTranslation(locale, key);

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 bg-cream">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <Badge variant="accent">{t('packages.rideFormats')}</Badge>
          <h1 className="mt-4">
            {t('packages.findTheRide')}
          </h1>
          <p className="mt-4 text-lg text-ink-muted max-w-2xl mx-auto">
            {t('packages.pageDescription')}
          </p>
        </div>
      </section>

      <RidePackages />
      <TimeSlots />
      <WhatsIncluded />
      <CTASection />
    </>
  );
}
