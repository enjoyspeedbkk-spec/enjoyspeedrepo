"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { signInWithGoogle } from "@/lib/actions/auth";
import { sendEmailOtp, verifyEmailOtp } from "@/lib/actions/email-auth";
import { createBrowserClient } from "@supabase/ssr";
import { Mail, AlertCircle, Info, Loader2, RefreshCw } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// =============================================
// Email-First Auth Form
// Primary: Email OTP → creates/finds Supabase user + session
// Secondary: "Continue with Google" option
// =============================================

export function AuthForm() {
  const { t } = useLanguage();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const cleanEmail = email.trim().toLowerCase();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isValidEmail) return;
    setError("");
    setLoading(true);

    try {
      const result = await sendEmailOtp(cleanEmail, name || undefined);
      if (!result.success) {
        setError(result.error || "Failed to send code");
      } else {
        setStep("otp");
        setCountdown(60);
        // Focus first OTP input after render
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance to next input
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits entered
    const code = newOtp.join("");
    if (code.length === 6) {
      handleVerifyOtp(code);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split("");
      setOtp(newOtp);
      handleVerifyOtp(pasted);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setError("");
    setLoading(true);

    try {
      const result = await verifyEmailOtp(cleanEmail, code, name || undefined);
      if (!result.success) {
        setError(result.error || "Invalid code");
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
      } else {
        // Establish real Supabase browser session
        if (result.tokenHash) {
          try {
            const supabase = createBrowserClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );
            await supabase.auth.verifyOtp({
              token_hash: result.tokenHash,
              type: "magiclink",
            });
          } catch (err) {
            console.warn("Session creation failed:", err);
          }
        }
        // Redirect — full page load so middleware picks up the new session
        window.location.href = "/booking";
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    }
    setLoading(false);
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    await handleRequestOtp();
  };

  return (
    <section className="min-h-screen pt-24 pb-16 bg-cream">
      <div className="mx-auto max-w-md px-6">
        <div className="text-center mb-8">
          <Badge variant="accent">{t('auth.welcome')}</Badge>
          <h1 className="mt-4 text-3xl font-bold">
            {step === "email" ? t('auth.signInToBook') : t('common.error')}
          </h1>
          <p className="mt-2 text-ink-muted text-sm">
            {step === "email"
              ? t('auth.verificationCodeSent')
              : `We sent a 6-digit code to ${cleanEmail}`}
          </p>
        </div>

        <Card padding="lg">
          {step === "email" ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              {/* Name (optional) */}
              <div>
                <label htmlFor="auth-name" className="block text-sm font-medium text-ink mb-1.5">
                  {t('auth.yourName')}
                </label>
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('auth.yourName')}
                  autoComplete="name"
                  className="w-full px-4 py-3 rounded-xl border-2 border-sand/60 bg-surface text-ink placeholder:text-ink-muted/70 focus:border-ink focus:outline-none transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="auth-email" className="block text-sm font-medium text-ink mb-1.5">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-sand/60 bg-surface text-ink placeholder:text-ink-muted/70 focus:border-ink focus:outline-none transition-colors"
                  />
                </div>
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
                disabled={!isValidEmail}
              >
                {t('common.continue')}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              {/* 6-digit OTP boxes */}
              <div>
                <label className="block text-sm font-medium text-ink mb-3 text-center">
                  {t('auth.email')}
                </label>
                <div className="flex justify-center gap-2">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      aria-label={`Digit ${i + 1} of 6`}
                      className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-sand/60 bg-surface text-ink focus:border-accent focus:outline-none transition-colors"
                    />
                  ))}
                </div>
                <p className="text-xs text-ink-muted mt-2 text-center">
                  Code is valid for 10 minutes
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-error/5 text-error text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {loading && (
                <div className="flex items-center justify-center gap-2 text-sm text-ink-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </div>
              )}

              {/* Resend / change email */}
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtp(["", "", "", "", "", ""]);
                    setError("");
                  }}
                  className="text-ink-muted hover:text-ink transition-colors"
                >
                  {t('common.back')}
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={countdown > 0}
                  className={`flex items-center gap-1 font-semibold transition-colors ${
                    countdown > 0
                      ? "text-ink-muted/50 cursor-not-allowed"
                      : "text-accent hover:text-accent-dark"
                  }`}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
                </button>
              </div>
            </div>
          )}

          {/* Google fallback — secondary */}
          {step === "email" && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-sand/60" />
                <span className="text-xs text-ink-muted font-medium">
                  {t('auth.orUseEmail')}
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
                {t('auth.signInDescription')}
              </p>
            </>
          )}
        </Card>
      </div>
    </section>
  );
}
