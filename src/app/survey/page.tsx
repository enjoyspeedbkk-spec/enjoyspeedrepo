import { SurveyForm } from "@/components/survey/SurveyForm";

export const metadata = {
  title: "How was your ride? | En-Joy Speed",
  description: "Share your feedback after your En-Joy Speed cycling experience.",
};

export default function SurveyPage({
  searchParams,
}: {
  searchParams: { booking?: string; name?: string };
}) {
  const bookingId = searchParams.booking || "";
  const contactName = searchParams.name || "";

  if (!bookingId) {
    return (
      <section className="min-h-screen pt-24 pb-16 bg-cream flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="text-2xl font-bold mb-2">Survey link invalid</h1>
          <p className="text-ink-muted">Please use the link we sent you after your ride.</p>
        </div>
      </section>
    );
  }

  return <SurveyForm bookingId={bookingId} contactName={contactName} />;
}
