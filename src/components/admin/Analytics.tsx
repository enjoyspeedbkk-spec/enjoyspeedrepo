"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { TrendingUp, Users, Clock, CreditCard } from "lucide-react";

interface RevenueData {
  dailyRevenue: Record<string, number>;
  totalRevenue: number;
}

interface RiderMetrics {
  totalUsers: number;
  newUsers: number;
  repeatUsers: number;
  thisMonthRiders: number;
}

interface SlotPopularity {
  [slotId: string]: {
    bookings: number;
    riders: number;
  };
}

interface PaymentBreakdown {
  [method: string]: {
    count: number;
    total: number;
  };
}

interface TopCustomer {
  id: string;
  name: string;
  rides: number;
  totalSpent: number;
  riders: number;
}

interface AnalyticsProps {
  revenueData: RevenueData;
  riderMetrics: RiderMetrics;
  slotPopularity: SlotPopularity;
  paymentBreakdown: PaymentBreakdown;
  topCustomers: TopCustomer[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
  },
};

export function Analytics({
  revenueData,
  riderMetrics,
  slotPopularity,
  paymentBreakdown,
  topCustomers,
}: AnalyticsProps) {
  const days = Object.keys(revenueData.dailyRevenue).length;
  const maxRevenue = Math.max(...Object.values(revenueData.dailyRevenue), 1);

  // Get sorted slot names from slotPopularity
  const sortedSlots = Object.entries(slotPopularity)
    .sort(([, a], [, b]) => b.bookings - a.bookings)
    .slice(0, 5);

  const maxSlotBookings = Math.max(
    ...sortedSlots.map(([, data]) => data.bookings),
    1
  );

  // Get payment methods sorted by total
  const sortedPaymentMethods = Object.entries(paymentBreakdown)
    .sort(([, a], [, b]) => b.total - a.total);

  const totalPaymentAmount = sortedPaymentMethods.reduce(
    (sum, [, data]) => sum + data.total,
    0
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Key Metrics */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-accent/10 rounded-lg">
                <TrendingUp className="w-4 h-4 text-accent" />
              </div>
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                Total Revenue
              </span>
            </div>
            <p className="text-2xl font-bold text-ink">
              {Math.round(revenueData.totalRevenue).toLocaleString()} THB
            </p>
            <p className="text-xs text-ink-muted">Last 30 days</p>
          </div>
        </Card>

        <Card padding="md">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-sky/10 rounded-lg">
                <Users className="w-4 h-4 text-sky" />
              </div>
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                Total Riders
              </span>
            </div>
            <p className="text-2xl font-bold text-ink">
              {riderMetrics.thisMonthRiders}
            </p>
            <p className="text-xs text-ink-muted">This month</p>
          </div>
        </Card>

        <Card padding="md">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-leaf/10 rounded-lg">
                <Users className="w-4 h-4 text-leaf" />
              </div>
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                Total Customers
              </span>
            </div>
            <p className="text-2xl font-bold text-ink">
              {riderMetrics.totalUsers}
            </p>
            <p className="text-xs text-ink-muted">
              {riderMetrics.newUsers} new, {riderMetrics.repeatUsers} repeat
            </p>
          </div>
        </Card>

        <Card padding="md">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="w-4 h-4 text-warning" />
              </div>
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                Payment Methods
              </span>
            </div>
            <p className="text-2xl font-bold text-ink">
              {sortedPaymentMethods.length}
            </p>
            <p className="text-xs text-ink-muted">Active methods</p>
          </div>
        </Card>
      </motion.div>

      {/* Revenue Chart */}
      <motion.div variants={itemVariants}>
        <Card padding="lg">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-ink">Revenue Trend</h2>
            <div className="space-y-3">
              <div className="flex items-end gap-1 h-48 overflow-x-auto pb-4">
                {Object.entries(revenueData.dailyRevenue).map(
                  ([date, amount], idx) => {
                    const heightPercent = (amount / maxRevenue) * 100;
                    const dateObj = new Date(date);
                    const dayName = dateObj.toLocaleDateString("en-US", {
                      weekday: "short",
                    });
                    const dayNum = dateObj.getDate();

                    return (
                      <motion.div
                        key={date}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "100%" }}
                        transition={{ delay: idx * 0.02 }}
                        className="flex-shrink-0 flex flex-col items-center gap-1"
                      >
                        <div className="text-xs text-ink-muted font-medium">
                          {amount > 0 ? amount.toLocaleString() : "0"} THB
                        </div>
                        <motion.div
                          whileHover={{ scaleY: 1.05, opacity: 1 }}
                          className="w-6 rounded-t bg-accent/80 hover:bg-accent transition-colors cursor-pointer"
                          style={{
                            height: `${Math.max(heightPercent, 8)}%`,
                          }}
                        />
                        <div className="text-xs text-ink-muted mt-1">
                          <div>{dayNum}</div>
                          <div>{dayName}</div>
                        </div>
                      </motion.div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Rider Metrics & Slot Popularity */}
      <motion.div variants={itemVariants} className="grid lg:grid-cols-2 gap-8">
        {/* Rider Breakdown */}
        <Card padding="lg">
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-ink">Rider Metrics</h2>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-ink-light">
                    Total Unique Customers
                  </span>
                  <span className="text-sm font-bold text-ink">
                    {riderMetrics.totalUsers}
                  </span>
                </div>
                <div className="w-full h-2 bg-sand rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full bg-accent rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-ink-light">
                    New Customers (All-time)
                  </span>
                  <span className="text-sm font-bold text-ink">
                    {riderMetrics.newUsers}
                  </span>
                </div>
                <div className="w-full h-2 bg-sand rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${
                        (riderMetrics.newUsers / riderMetrics.totalUsers) * 100
                      }%`,
                    }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="h-full bg-leaf rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-ink-light">
                    Repeat Customers
                  </span>
                  <span className="text-sm font-bold text-ink">
                    {riderMetrics.repeatUsers}
                  </span>
                </div>
                <div className="w-full h-2 bg-sand rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${
                        (riderMetrics.repeatUsers / riderMetrics.totalUsers) *
                        100
                      }%`,
                    }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="h-full bg-sky rounded-full"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-sand">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink-light">
                    Riders This Month
                  </span>
                  <span className="text-lg font-bold text-accent">
                    {riderMetrics.thisMonthRiders}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Slot Popularity */}
        <Card padding="lg">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-ink">Top Time Slots</h2>

            <div className="space-y-4">
              {sortedSlots.map(([slotId, data], idx) => {
                const widthPercent = (data.bookings / maxSlotBookings) * 100;
                const slotNames: Record<string, string> = {
                  "sunrise": "Sunrise (6:00 AM)",
                  "earlymorning": "Early Morning (7:00 AM)",
                  "morning": "Morning (8:00 AM)",
                  "midmorning": "Mid-Morning (9:00 AM)",
                  "late-morning": "Late Morning (10:00 AM)",
                  "noon": "Noon (12:00 PM)",
                  "afternoon": "Afternoon (1:00 PM)",
                  "late-afternoon": "Late Afternoon (3:00 PM)",
                  "evening": "Evening (5:00 PM)",
                  "sunset": "Sunset (6:00 PM)",
                };

                return (
                  <motion.div
                    key={slotId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-ink">
                        {slotNames[slotId] || slotId}
                      </span>
                      <span className="text-sm font-bold text-accent">
                        {data.bookings} bookings · {data.riders} riders
                      </span>
                    </div>
                    <div className="w-full h-2 bg-sand rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPercent}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.1 + 0.3 }}
                        className="h-full bg-accent rounded-full"
                      />
                    </div>
                  </motion.div>
                );
              })}

              {sortedSlots.length === 0 && (
                <p className="text-sm text-ink-muted">No booking data yet</p>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Payment Methods & Top Customers */}
      <motion.div variants={itemVariants} className="grid lg:grid-cols-2 gap-8">
        {/* Payment Method Breakdown */}
        <Card padding="lg">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-ink">Payment Methods</h2>

            <div className="space-y-3">
              {sortedPaymentMethods.map(([method, data], idx) => {
                const widthPercent = (data.total / totalPaymentAmount) * 100;
                const methodNames: Record<string, string> = {
                  promptpay: "PromptPay",
                  transfer: "Bank Transfer",
                  slip: "Slip Upload",
                  card: "Credit Card",
                  cash: "Cash",
                  unknown: "Other",
                };

                const methodColors: Record<string, string> = {
                  promptpay: "bg-accent",
                  transfer: "bg-sky",
                  slip: "bg-leaf",
                  card: "bg-warning",
                  cash: "bg-sky-light",
                  unknown: "bg-sand",
                };

                return (
                  <motion.div
                    key={method}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-ink">
                        {methodNames[method] || method}
                      </span>
                      <span className="text-sm font-bold text-accent">
                        {Math.round(data.total).toLocaleString()} THB
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-sand rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${widthPercent}%` }}
                          transition={{ duration: 0.6, delay: idx * 0.08 + 0.2 }}
                          className={`h-full rounded-full ${
                            methodColors[method] || "bg-sand"
                          }`}
                        />
                      </div>
                      <span className="text-xs text-ink-muted font-medium w-12 text-right">
                        {data.count} txn
                      </span>
                    </div>
                  </motion.div>
                );
              })}

              {sortedPaymentMethods.length === 0 && (
                <p className="text-sm text-ink-muted">No payment data yet</p>
              )}
            </div>
          </div>
        </Card>

        {/* Top Customers */}
        <Card padding="lg">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-ink">Top Repeat Customers</h2>

            <div className="space-y-3">
              {topCustomers.length > 0 ? (
                topCustomers.map((customer, idx) => (
                  <motion.div
                    key={customer.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className="flex items-start justify-between p-3 rounded-lg bg-cream-dark/50 border border-sand/30"
                  >
                    <div className="flex-1 space-y-1">
                      <p className="font-medium text-ink">{customer.name}</p>
                      <p className="text-xs text-ink-muted">
                        {customer.rides} ride{customer.rides !== 1 ? "s" : ""} ·{" "}
                        {customer.riders} rider{customer.riders !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-accent">
                        {Math.round(customer.totalSpent).toLocaleString()} THB
                      </p>
                      <p className="text-xs text-ink-muted">spent</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-sm text-ink-muted">No customer data yet</p>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
