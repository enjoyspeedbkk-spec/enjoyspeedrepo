import { Hero } from "@/components/home/Hero";
import { RidePackages } from "@/components/home/RidePackages";
import { HowItWorks } from "@/components/home/HowItWorks";
import { GalleryCarousel } from "@/components/home/GalleryCarousel";
import { TimeSlots } from "@/components/home/TimeSlots";
import { WhatsIncluded } from "@/components/home/WhatsIncluded";
import { FAQ } from "@/components/home/FAQ";
import { Testimonials } from "@/components/home/Testimonials";
import { CTASection } from "@/components/home/CTASection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <RidePackages />
      <HowItWorks />
      <GalleryCarousel />
      <TimeSlots />
      <WhatsIncluded />
      <FAQ />
      <Testimonials />
      <CTASection />
    </>
  );
}
