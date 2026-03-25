import { getLineFollowers } from "@/lib/actions/admin";
import { LineFollowersView } from "@/components/admin/LineFollowersView";

export default async function LineFollowersPage() {
  const followers = await getLineFollowers();
  return <LineFollowersView followers={followers} />;
}
