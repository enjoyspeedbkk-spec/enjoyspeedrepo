import {
  getRevenueStats,
  getRiderMetrics,
  getSlotPopularity,
  getPaymentMethodBreakdown,
  getTopCustomers,
} from "@/lib/actions/admin-analytics";
import { Analytics } from "@/components/admin/Analytics";

export const metadata = {
  title: "Analytics | Admin",
};

export default async function AnalyticsPage() {
  const [
    revenueData,
    riderMetrics,
    slotPopularity,
    paymentBreakdown,
    topCustomers,
  ] = await Promise.all([
    getRevenueStats(30),
    getRiderMetrics(),
    getSlotPopularity(),
    getPaymentMethodBreakdown(),
    getTopCustomers(10),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-ink-muted mt-1">
          30-day performance overview
        </p>
      </div>

      <Analytics
        revenueData={revenueData}
        riderMetrics={riderMetrics}
        slotPopularity={slotPopularity}
        paymentBreakdown={paymentBreakdown}
        topCustomers={topCustomers}
      />
    </div>
  );
}
