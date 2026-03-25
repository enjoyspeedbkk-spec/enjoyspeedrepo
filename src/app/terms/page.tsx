import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | En-Joy Speed",
  description:
    "Terms of service for En-Joy Speed cycling experience platform.",
};

export default function TermsPage() {
  const lastUpdated = "March 22, 2026";

  return (
    <main className="min-h-screen bg-surface py-16 lg:py-24">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-ink mb-2">Terms of Service</h1>
        <p className="text-sm text-ink-muted mb-10">
          Last updated: {lastUpdated}
        </p>

        <div className="space-y-8 text-ink-muted leading-relaxed text-[15px]">
          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By using the En-Joy Speed platform (&quot;Service&quot;), you
              agree to these Terms of Service. If you do not agree, please do
              not use the Service. These terms apply to all users of the website,
              LINE Official Account, and booking system.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">
              2. Our Service
            </h2>
            <p>
              En-Joy Speed provides guided group cycling experiences at the
              Skylane (Happy and Healthy Bike Lane) near Suvarnabhumi, Bangkok. Through our platform, you can book
              rides, manage rider details, and process payments. All rides are
              supervised by trained Athlete Leaders and Hero Riders.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">
              3. Bookings & Payments
            </h2>
            <p>
              Bookings must be made at least 24 hours in advance. Upon booking,
              you will receive a PromptPay QR code for payment. Payment must be
              completed within 2 hours of booking. Bookings are confirmed only
              after payment has been verified by our team. Prices displayed at
              the time of booking are final. Bike rental fees are payable at the
              track on the day of the ride.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">
              4. Cancellations & Refunds
            </h2>
            <p>
              You may cancel a confirmed booking by contacting us via LINE or
              email at least 48 hours before the ride for a full refund. For
              cancellations within 48 hours, we offer a rain credit valid for 90
              days. Weather cancellations initiated by En-Joy Speed entitle you
              to a full refund or rain credit at your choice. No-shows are not
              eligible for refunds.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">
              5. Waiver & Liability
            </h2>
            <p>
              All riders must accept the liability waiver before participating.
              Cycling involves inherent risks including falls, injuries, and
              equipment failure. By accepting the waiver, you acknowledge these
              risks and agree that En-Joy Speed, its staff, and the circuit are
              not liable for injuries resulting from the activity, except in
              cases of gross negligence. Emergency contact information must be
              provided for all riders.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">
              6. Rider Responsibilities
            </h2>
            <p>
              Riders must follow all instructions from the Athlete Leader and
              Hero Riders, wear the provided safety equipment (helmet required),
              be in reasonable physical condition for cycling, not ride under the
              influence of alcohol or drugs, and report any equipment concerns
              before the ride begins.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">
              7. Photography & Content
            </h2>
            <p>
              We may take photographs and videos during rides for promotional
              purposes. By participating, you consent to being photographed
              unless you opt out via the post-ride survey or notify staff before
              the ride. You may request removal of specific photos by contacting
              us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">
              8. Account Security
            </h2>
            <p>
              You are responsible for maintaining the security of your account
              credentials. Do not share your verification codes with others. We
              will never ask for your password or OTP codes via LINE or email.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">
              9. Modifications
            </h2>
            <p>
              We reserve the right to modify these terms at any time. Continued
              use of the Service after changes constitutes acceptance. We will
              notify users of significant changes via email or LINE.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">
              10. Governing Law
            </h2>
            <p>
              These terms are governed by the laws of the Kingdom of Thailand.
              Any disputes shall be resolved in the courts of Bangkok, Thailand.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">
              11. Contact
            </h2>
            <p>
              For questions about these terms, reach us via LINE (@691gsvky)
              or email at enjoyspeed.bkk@gmail.com.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
