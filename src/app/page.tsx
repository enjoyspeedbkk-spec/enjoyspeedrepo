import { Hero } from "@/components/home/Hero";
import { RidePackages } from "@/components/home/RidePackages";
import { TimeSlots } from "@/components/home/TimeSlots";
import { WhatsIncluded } from "@/components/home/WhatsIncluded";
import { CTASection } from "@/components/home/CTASection";
import { SiteImagesProvider } from "@/lib/site-images-context";
import { getSiteImageSettings } from "@/lib/actions/site-images";
import { getHeroVideoConfig } from "@/lib/actions/hero-videos";

export default async function HomePage() {
  const images = await getSiteImageSettings();
  const heroVideos = await getHeroVideoConfig();

  const imageMap = Object.fromEntries(
    images.map((img) => [
      img.image_key,
      {
        url: img.current_url,
        objectPosition: img.object_position,
        brightness: img.brightness,
        contrast: img.contrast,
        saturate: img.saturate,
      },
    ])
  );

  return (
    <SiteImagesProvider images={imageMap}>
      <Hero videos={heroVideos} />
      <RidePackages />
      <TimeSlots />
      <WhatsIncluded />
      <CTASection />
    </SiteImagesProvider>
  );
}
