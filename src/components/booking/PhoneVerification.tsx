"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ShieldCheck, Loader2, ArrowRight, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { sendPhoneOtp, verifyPhoneOtp } from "@/lib/actions/phone-auth";

interface PhoneVerificationProps {
  initialPhone?: string;
  contactName: string;
  onVerified: (phone: string, userId: string) => void;
  onSkipAuth?: () => void; // If user is already logged in
}

export function PhoneVerification({
  initialPhone = "",
  contactName,
  onVerified,
  onSkipAuth,
}: PhoneVerificationProps) {
  const [phone, setPhone] = useState(initialPhone);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"phone" | "otp">("phone");
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

  // Format Thai phone number
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length <= 10) {
      setPhone(formatPhone(raw));
    }
  };

  const cleanPhone = phone.replace(/\D/g, "");
  const isValidPhone = /^0[689]\d{8}$/.test(cleanPhone);

  const handleSendOtp = async () => {
    if (!isValidPhone) {
      setError("Please enter a valid Thai phone number (0XX-XXX-XXXX)");
      return;
    }

    setSending(true);
    setError("");

    const result = await sendPhoneOtp(cleanPhone, contactName);

    setSending(false);

    if (result.success) {
      setStep("otp");
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      // Focus first OTP input after render
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

    // Auto-advance to next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
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

    const result = await verifyPhoneOtp(cleanPhone, code, contactName);

    setVerifying(false);

    if (result.success && result.userId) {
      onVerified(cleanPhone, result.userId);
    } else {
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
          <Phone className="h-6 w-6 text-accent" />
        </div>
        <h2 className="text-xl font-bold text-ink">Verify your phone</h2>
        <p className="text-sm text-ink-muted mt-2">
          We&apos;ll send a 6-digit code to confirm your booking and keep you updated about your ride.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === "phone" ? (
          <motion.div
            key="phone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Card padding="lg">
              <label className="block text-sm font-medium text-ink mb-2">
                Thai phone number
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted text-sm font-medium">
                  +66
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="08X-XXX-XXXX"
                  className="w-full pl-14 pr-4 py-3.5 rounded-xl border-2 border-sand/60 bg-surface text-ink text-lg font-medium placeholder:text-ink-muted/40 focus:border-ink focus:outline-none transition-colors"
                  autoFocus
                />
              </div>

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
                disabled={!isValidPhone || sending}
                className="mt-4"
              >
                {sending ? "Sending code..." : "Send verification code"}
                {!sending && <ArrowRight className="h-4 w-4" />}
              </Button>

              <p className="mt-3 text-xs text-center text-ink-muted">
                Standard SMS rates may apply. We&apos;ll only use this number for ride-related messages.
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
              <p className="font-semibold text-ink mb-4">+66 {phone}</p>

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
                  onClick={() => {
                    setStep("phone");
                    setError("");
                  }}
                  className="text-sm text-ink-muted hover:text-ink transition-colors"
                >
                  Change number
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
