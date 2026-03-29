import { getAllFeedback } from "@/lib/actions/feedback";
import { AdminFeedback } from "@/components/admin/AdminFeedback";

export default async function AdminFeedbackPage() {
  const { surveys, reviews, stats } = await getAllFeedback();

  return <AdminFeedback surveys={surveys} reviews={reviews} stats={stats} />;
}
