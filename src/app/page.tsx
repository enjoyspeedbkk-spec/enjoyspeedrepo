import { Hero } from "@/components/home/Hero";
import { RidePackages } from "@/components/home/RidePackages";
import { HowItWorks } from "@/components/home/HowItWorks";
import { TimeSlots } from "@/components/home/TimeSlots";
import { WhatsIncluded } from "@/components/home/WhatsIncluded";
import { FAQ } from "@/components/home/FAQ";
import { CTASection } from "@/components/home/CTASection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <RidePackages />
      <HowItWorks />
      <TimeSlots />
      <WhatsIncluded />
      <FAQ />
      <CTASection />
    </>
  );
}
