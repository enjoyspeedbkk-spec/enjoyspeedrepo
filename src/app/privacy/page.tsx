import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | En-Joy Speed",
  description:
    "Privacy policy for En-Joy Speed cycling experience platform. How we collect, use, and protect your data.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "March 22, 2026";

  return (
    <main className="min-h-screen bg-surface py-16 lg:py-24">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-ink mb-2">Privacy Policy</h1>
        <p className="text-sm text-ink-muted mb-10">
          Last updated: {lastUpdated}
        </p>

        <div className="space-y-8 text-ink-muted leading-relaxed text-[15px]">
          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">
              1. Who We Are
            </h2>
            <p>
              En-Joy Speed (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;)
              operates the En-Joy Speed cycling experience booking platform
              available at enjoyspeed.com and through our LINE Official Account.
              We are based in Bangkok, Thailand and provide guided cycling
              experiences on the Skylane, Suvarnabhumi.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">
              2. Information We Collect
            </h2>
            <p className="mb-3">
              We collect information you provide directly when using our
              services:
            </p>
            <p>
              <strong className="text-ink">Account information:</strong> Name
              and email address when you create an account or verify your email.
              Optionally, phone number and LINE user ID if you choose to provide them.
            </p>
            <p className="mt-2">
              <strong className="text-ink">Booking information:</strong> Ride
              date and time preferences, group size, rider details (name,
              nickname, height, clothing size, cycling experience), emergency
              contact information, and special requests.
            </p>
            <p className="mt-2">
              <strong className="text-ink">Payment information:</strong> Payment
              slip images uploaded for PromptPay verification. We do not store
              credit card numbers or bank account details.
            </p>
            <p className="mt-2">
              <strong className="text-ink">Survey responses:</strong> Optional
              post-ride feedback including ratings, comments, and photo consent
              preferences.
            </p>
            <p className="mt-2">
              <strong className="text-ink">Technical data:</strong> IP address,
              browser type, device information, and cookies necessary for site
              functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">
              3. How We Use Your Information
            </h2>
            <p>
              We use your information to process and manage your ride bookings,
              verify your identity and payment, communicate ride details and
              updates (including weather cancellations), provide customer
              support, assign appropriate equipment for your ride, contact
              emergency contacts if necessary during a ride, improve our services
              based on feedback, and send booking confirmations via email and
              LINE.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">
              4. LINE Integration
            </h2>
            <p>
              When you interact with our LINE Official Account, we receive your
              LINE user ID and display name. We use this to send you booking
              confirmations, ride reminders, weather updates, and respond to your
              inquiries. We do not access your LINE contacts, timeline, or any
              other LINE data beyond what is necessary for our booking service.
              You can unfollow our LINE account at any time to stop receiving
              messages.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">
              5. Data Sharing
            </h2>
            <p>
              We do not sell your personal information. We share data only with
              our ride leaders and support staff (rider details needed for your
              session), payment verification services, email and SMS delivery
              providers (for sending notifications), and hosting and
              infrastructure providers (Supabase, Vercel). We may disclose
              information if required by Thai law or to protect safety.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">
              6. Data Security
            </h2>
            <p>
              We implement industry-standard security measures including
              encrypted data transmission (HTTPS/TLS), secure server-side
              authentication, row-level security on our database, and secure
              storage for payment slip images. While no system is 100% secure,
              we take reasonable measures to protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">
              7. Data Retention
            </h2>
            <p>
              We retain your account information for as long as your account is
              active. Booking records are retained for 2 years for business and
              legal purposes. Payment slip images are retained for 90 days after
              payment verification. You may request deletion of your account and
              associated data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">
              8. Your Rights
            </h2>
            <p>
              Under the Thailand Personal Data Protection Act (PDPA), you have
              the right to access, correct, delete, or transfer your personal
              data, withdraw consent for data processing, and file a complaint
              with the relevant authority. To exercise these rights, contact us
              at the details below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">
              9. Cookies
            </h2>
            <p>
              We use essential cookies for authentication and session management.
              We do not use advertising or tracking cookies. Third-party
              analytics may collect anonymized usage data to help us improve the
              site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">
              10. Changes to This Policy
            </h2>
            <p>
              We may update this privacy policy from time to time. We will
              notify you of significant changes via email or LINE message. The
              &quot;Last updated&quot; date at the top of this page indicates
              when it was last revised.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">
              11. Contact Us
            </h2>
            <p>
              If you have questions about this privacy policy or your data,
              contact us through our LINE Official Account (@enjoyspeed) or by
              email at support@enjoyspeed.com.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
