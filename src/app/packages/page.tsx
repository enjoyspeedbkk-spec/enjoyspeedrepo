import { RidePackages } from "@/components/home/RidePackages";
import { TimeSlots } from "@/components/home/TimeSlots";
import { WhatsIncluded } from "@/components/home/WhatsIncluded";
import { CTASection } from "@/components/home/CTASection";
import { Badge } from "@/components/ui/Badge";

export const metadata = {
  title: "Ride Packages | En-Joy Speed",
  description:
    "Explore our ride formats: Duo, Squad, and Peloton. Premium guided cycling on Bangkok's Skylane.",
};

export default function PackagesPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 bg-cream">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <Badge variant="accent">Ride Formats</Badge>
          <h1 className="mt-4">
            Find the ride that fits
          </h1>
          <p className="mt-4 text-lg text-ink-muted max-w-2xl mx-auto">
            Three curated formats. Every ride guided by Athlete Leaders with
            full safety support, photography, and post-ride recovery included.
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
