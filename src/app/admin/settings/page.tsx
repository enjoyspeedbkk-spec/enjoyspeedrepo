import {
  getSiteConfig,
  getPackagesConfig,
  getTimeSlotsConfig,
  getBikeRentalsConfig,
  getStarterKitConfig,
  getStaffMembers,
  getPromoCodes,
} from "@/lib/actions/admin";
import { AdminSettings } from "@/components/admin/AdminSettings";

export default async function AdminSettingsPage() {
  const [siteConfig, packages, timeSlots, bikeRentals, starterKit, staff, promos] =
    await Promise.all([
      getSiteConfig(),
      getPackagesConfig(),
      getTimeSlotsConfig(),
      getBikeRentalsConfig(),
      getStarterKitConfig(),
      getStaffMembers(),
      getPromoCodes(),
    ]);

  return (
    <AdminSettings
      siteConfig={siteConfig}
      packages={packages}
      timeSlots={timeSlots}
      bikeRentals={bikeRentals}
      starterKit={starterKit}
      staff={staff}
      promos={promos}
    />
  );
}
