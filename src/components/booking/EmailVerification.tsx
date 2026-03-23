"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ShieldCheck, Loader2, ArrowRight, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { sendEmailOtp, verifyEmailOtp } from "@/lib/actions/email-auth";
import { createBrowserClient } from "@supabase/ssr";

interface EmailVerificationProps {
  initialEmail?: string;
  contactName: string;
  onVerified: (email: string, userId: string) => void;
  onSkipAuth?: () => void;
}

export function EmailVerification({
  initialEmail = "",
  contactName,
  onVerified,
  onSkipAuth,
}: EmailVerificationProps) {
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"email" | "otp">("email");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const cleanEmail = email.trim().toLowerCase();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);

  const handleSendOtp = async () => {
    if (!isValidEmail) {
      setError("Please enter a valid email address");
      return;
    }

    setSending(true);
    setError("");

    const result = await sendEmailOtp(cleanEmail, contactName);

    setSending(false);

    if (result.success) {
      setStep("otp");
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } else {
      setError(result.error || "Failed to send verification code");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (value && index === 5) {
      const code = newOtp.join("");
      if (code.length === 6) {
        handleVerifyOtp(code);
      }
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
    setVerifying(true);
    setError("");

    const result = await verifyEmailOtp(cleanEmail, code, contactName);

    if (result.success && result.userId) {
      // Establish a real Supabase browser session if we got a token
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
          // Non-blocking — booking still works via userId, session is a bonus
          console.warn("Session creation failed:", err);
        }
      }
      setVerifying(false);
      onVerified(cleanEmail, result.userId);
    } else {
      setVerifying(false);
      setError(result.error || "Invalid code. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    await handleSendOtp();
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/10 mb-4">
          <Mail className="h-6 w-6 text-accent" />
        </div>
        <h2 className="text-xl font-bold text-ink">Verify your email</h2>
        <p className="text-sm text-ink-muted mt-2">
          We&apos;ll send a 6-digit code to confirm your booking and keep you updated about your ride.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === "email" ? (
          <motion.div
            key="email"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Card padding="lg">
              <label className="block text-sm font-medium text-ink mb-2">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3.5 rounded-xl border-2 border-sand/60 bg-surface text-ink text-lg placeholder:text-ink-muted/40 focus:border-ink focus:outline-none transition-colors"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && isValidEmail && handleSendOtp()}
              />

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-error"
                >
                  {error}
                </motion.p>
              )}

              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={handleSendOtp}
                loading={sending}
                disabled={!isValidEmail || sending}
                className="mt-4"
              >
                {sending ? "Sending code..." : "Send verification code"}
                {!sending && <ArrowRight className="h-4 w-4" />}
              </Button>

              <p className="mt-3 text-xs text-center text-ink-muted">
                We&apos;ll only email you about your ride. No spam, ever.
              </p>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="otp"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Card padding="lg">
              <p className="text-sm text-ink-muted mb-1">Code sent to</p>
              <p className="font-semibold text-ink mb-4">{cleanEmail}</p>

              {/* OTP Input */}
              <div className="flex gap-2 justify-center mb-4">
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
                    className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-surface transition-all duration-200 focus:outline-none ${
                      digit
                        ? "border-ink text-ink"
                        : "border-sand/60 text-ink-muted"
                    } focus:border-accent focus:shadow-sm`}
                  />
                ))}
              </div>

              {verifying && (
                <div className="flex items-center justify-center gap-2 text-sm text-ink-muted mb-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </div>
              )}

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 text-sm text-error text-center"
                >
                  {error}
                </motion.p>
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={() => { setStep("email"); setError(""); }}
                  className="text-sm text-ink-muted hover:text-ink transition-colors"
                >
                  Change email
                </button>
                <button
                  onClick={handleResend}
                  disabled={countdown > 0}
                  className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                    countdown > 0
                      ? "text-ink-muted/50 cursor-default"
                      : "text-accent hover:text-accent-dark"
                  }`}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
                </button>
              </div>
            </Card>

            <div className="mt-4 flex items-center gap-2 justify-center text-xs text-ink-muted">
              <ShieldCheck className="h-3.5 w-3.5" />
              Your code expires in 10 minutes
            </div>

            <p className="mt-2 text-xs text-center text-ink-muted">
              Check your spam folder if you don&apos;t see the email.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
