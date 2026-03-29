import { getSiteImageSettings } from "@/lib/actions/site-images";
import { getHeroVideos } from "@/lib/actions/hero-videos";
import { SiteImageManager } from "@/components/admin/SiteImageManager";
import { HeroVideoManager } from "@/components/admin/HeroVideoManager";

export default async function AdminImagesPage() {
  const images = await getSiteImageSettings();
  const heroVideos = await getHeroVideos();

  return (
    <div className="space-y-12">
      <SiteImageManager initialImages={images} />
      <div className="border-t pt-12">
        <HeroVideoManager initialVideos={heroVideos} />
      </div>
    </div>
  );
}
