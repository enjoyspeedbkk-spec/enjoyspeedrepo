import { getSiteImageSettings } from "@/lib/actions/site-images";
import { SiteImageManager } from "@/components/admin/SiteImageManager";

export default async function AdminImagesPage() {
  const images = await getSiteImageSettings();

  return <SiteImageManager initialImages={images} />;
}
