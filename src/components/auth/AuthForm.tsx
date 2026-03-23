"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { signInWithGoogle } from "@/lib/actions/auth";
import { sendPhoneOtp, verifyPhoneOtp } from "@/lib/actions/phone-auth";
import { Phone, AlertCircle, CheckCircle, Info, Loader2 } from "lucide-react";

// =============================================
// Phone-First Auth Form
// Primary: Phone OTP → creates/finds Supabase user
// Secondary: "Link Google" option in account settings
// =============================================

export function AuthForm() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [devHint, setDevHint] = useState("");
  const [loading, setLoading] = useState(false);

  // Format phone as user types: 0XX-XXX-XXXX
  const handlePhoneChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) setPhone(digits);
    else if (digits.length <= 6) setPhone(`${digits.slice(0, 3)}-${digits.slice(3)}`);
    else setPhone(`${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`);
  };

  const cleanPhone = phone.replace(/\D/g, "");
  const isValidPhone = /^0[689]\d{8}$/.test(cleanPhone);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone) return;
    setError("");
    setLoading(true);

    try {
      const result = await sendPhoneOtp(cleanPhone, name || undefined);
      if (!result.success) {
        setError(result.error || "Failed to send code");
      } else {
        // In dev/console mode, the code is returned as an "error" hint
        if (result.error && result.error.includes("[Dev Mode]")) {
          setDevHint(result.error);
        }
        setStep("otp");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) return;
    setError("");
    setLoading(true);

    try {
      const result = await verifyPhoneOtp(cleanPhone, otpCode, name || undefined);
      if (!result.success) {
        setError(result.error || "Invalid code");
      } else {
        // Verified — redirect to booking
        window.location.href = "/booking";
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <section className="min-h-screen pt-24 pb-16 bg-cream">
      <div className="mx-auto max-w-md px-6">
        <div className="text-center mb-8">
          <Badge variant="accent">Welcome</Badge>
          <h1 className="mt-4 text-3xl font-bold">
            {step === "phone" ? "Sign in to book" : "Enter your code"}
          </h1>
          <p className="mt-2 text-ink-muted text-sm">
            {step === "phone"
              ? "We'll send a verification code to your phone."
              : `We sent a 6-digit code to ${phone}`}
          </p>
        </div>

        <Card padding="lg">
          {step === "phone" ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              {/* Name (optional) */}
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What should we call you?"
                  className="w-full px-4 py-3 rounded-xl border-2 border-sand/60 bg-surface text-ink placeholder:text-ink-muted/50 focus:border-ink focus:outline-none transition-colors"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="08X-XXX-XXXX"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-sand/60 bg-surface text-ink placeholder:text-ink-muted/50 focus:border-ink focus:outline-none transition-colors"
                  />
                </div>
                <p className="text-xs text-ink-muted mt-1">
                  Thai mobile number starting with 06, 08, or 09
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-error/5 text-error text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                disabled={!isValidPhone}
              >
                Send Verification Code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* OTP input */}
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border-2 border-sand/60 bg-surface text-ink text-center text-2xl tracking-[0.3em] font-mono placeholder:text-ink-muted/30 focus:border-ink focus:outline-none transition-colors"
                />
                <p className="text-xs text-ink-muted mt-1.5 text-center">
                  Code is valid for 10 minutes
                </p>
              </div>

              {devHint && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-sky/10 text-sky-dark text-sm">
                  <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{devHint}</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-error/5 text-error text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                disabled={otpCode.length !== 6}
              >
                Verify &amp; Continue
              </Button>

              {/* Resend / change number */}
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setOtpCode("");
                    setError("");
                  }}
                  className="text-ink-muted hover:text-ink transition-colors"
                >
                  Change number
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setError("");
                    setLoading(true);
                    const result = await sendPhoneOtp(cleanPhone, name || undefined);
                    if (!result.success) setError(result.error || "Failed to resend");
                    setLoading(false);
                  }}
                  className="font-semibold text-accent hover:text-accent-dark transition-colors"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}

          {/* Google fallback — secondary */}
          {step === "phone" && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-sand/60" />
                <span className="text-xs text-ink-muted font-medium">
                  or continue with
                </span>
                <div className="flex-1 h-px bg-sand/60" />
              </div>

              <form action={signInWithGoogle}>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl border-2 border-sand/60 bg-surface hover:bg-sand/20 hover:border-ink/20 transition-all text-sm font-semibold text-ink"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </button>
              </form>

              <p className="mt-4 text-xs text-ink-muted text-center">
                Phone verification is our primary sign-in method.
                <br />
                Google is available as a backup option.
              </p>
            </>
          )}
        </Card>
      </div>
    </section>
  );
}
