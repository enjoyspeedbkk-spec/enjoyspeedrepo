import { getPendingPayments, getAllPayments } from "@/lib/actions/admin";
import { AdminPayments } from "@/components/admin/AdminPayments";

export default async function AdminPaymentsPage() {
  const [pending, all] = await Promise.all([
    getPendingPayments(),
    getAllPayments(),
  ]);
  return <AdminPayments pendingPayments={pending} allPayments={all} />;
}
