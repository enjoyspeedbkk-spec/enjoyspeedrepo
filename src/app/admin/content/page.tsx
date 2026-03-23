import { getUploadedAssets } from "@/lib/actions/admin-content";
import { ContentManager } from "@/components/admin/ContentManager";

export default async function ContentPage() {
  const assets = await getUploadedAssets();
  return <ContentManager initialAssets={assets} />;
}
