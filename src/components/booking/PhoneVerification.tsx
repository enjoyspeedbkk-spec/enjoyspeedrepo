"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ShieldCheck, Loader2, ArrowRight, RefreshCw, Globe, MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { sendPhoneOtp, verifyPhoneOtp } from "@/lib/actions/phone-auth";

interface PhoneVerificationProps {
  initialPhone?: string;
  contactName: string;
  onVerified: (phone: string, userId: string) => void;
  onSkipAuth?: () => void;
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
  const [devHint, setDevHint] = useState("");
  const [countdown, setCountdown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Detect format
  const isInternationalInput = phone.startsWith("+");
  const isThaiInput = !phone.startsWith("+");

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw.startsWith("+")) {
      const cleaned = "+" + raw.slice(1).replace(/[^\d]/g, "");
      if (cleaned.length <= 16) setPhone(cleaned);
    } else {
      const digits = raw.replace(/\D/g, "");
      if (digits.length <= 10) {
        // Thai local formatting
        if (digits.length <= 3) setPhone(digits);
        else if (digits.length <= 6) setPhone(`${digits.slice(0, 3)}-${digits.slice(3)}`);
        else setPhone(`${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`);
      }
    }
  };

  const cleanPhone = phone.replace(/[\s\-()]/g, "");
  const isThaiLocal = /^0[689]\d{8}$/.test(cleanPhone.replace(/\D/g, ""));
  const isInternational = /^\+\d{7,15}$/.test(cleanPhone);
  const isValidPhone = isThaiLocal || isInternational;

  // Format for display in OTP step
  const displayPhone = isThaiLocal
    ? `+66 ${cleanPhone.slice(1)}`
    : cleanPhone;

  const handleSendOtp = async () => {
    if (!isValidPhone) {
      setError("Enter a Thai number (08X-XXX-XXXX) or international (+CCXXXXXXXXX)");
      return;
    }

    setSending(true);
    setError("");
    setDevHint("");

    const result = await sendPhoneOtp(cleanPhone, contactName);

    setSending(false);

    if (result.success) {
      setStep("otp");
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      // Dev mode hint
      if (result.error && result.error.includes("[Dev Mode]")) {
        setDevHint(result.error);
      }
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
      if (code.length === 6) handleVerifyOtp(code);
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
      setOtp(pasted.split(""));
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
    setDevHint("");
    await handleSendOtp();
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
          <Phone className="h-7 w-7 text-accent" />
        </div>
        <h2 className="text-2xl font-bold text-ink mb-2">Verify your phone</h2>
        <p className="text-sm text-ink-muted leading-relaxed">
          We&apos;ll send a 6-digit code to confirm your booking<br className="hidden sm:block" />
          and keep you updated about your ride.
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
              {/* Label + format badge */}
              <div className="flex items-center justify-between mb-3">
                <label className="text-base font-semibold text-ink">
                  Phone number
                </label>
                {phone.length > 0 && (
                  <Badge variant={isThaiInput ? "sky" : "accent"}>
                    {isThaiInput ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Thailand
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" /> International
                      </span>
                    )}
                  </Badge>
                )}
              </div>

              {/* Phone input — no awkward +66 prefix */}
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="081-234-5678  or  +44 7911 123456"
                className={`w-full px-4 py-4 rounded-xl border-2 bg-surface text-ink text-lg font-medium placeholder:text-ink-muted/30 focus:outline-none transition-all ${
                  error && !devHint
                    ? "border-error/40 focus:border-error"
                    : "border-sand/60 focus:border-accent focus:ring-2 focus:ring-accent/10"
                }`}
                autoFocus
              />

              {/* Format hint */}
              <p className="mt-2 text-xs text-ink-muted">
                {isInternationalInput
                  ? "International format: + country code, then number"
                  : "Thai mobile (06/08/09) or type + for international"}
              </p>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3 rounded-lg bg-error/10 border border-error/20"
                >
                  <p className="text-sm text-error">{error}</p>
                </motion.div>
              )}

              {/* Send button */}
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={handleSendOtp}
                loading={sending}
                disabled={!isValidPhone || sending}
                className="mt-5"
              >
                {sending ? "Sending code..." : "Send verification code"}
                {!sending && <ArrowRight className="h-4 w-4" />}
              </Button>

              <p className="mt-3 text-xs text-center text-ink-muted">
                Standard SMS rates may apply. We only use your number for ride updates.
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
              {/* Sent-to confirmation */}
              <div className="mb-6">
                <p className="text-sm text-ink-muted mb-1">Verification code sent to</p>
                <p className="text-lg font-semibold text-ink">{displayPhone}</p>
              </div>

              {/* Dev mode hint */}
              {devHint && (
                <div className="mb-4 p-3 rounded-lg bg-sky/10 border border-sky/20">
                  <p className="text-sm text-sky-dark">{devHint}</p>
                </div>
              )}

              {/* OTP inputs */}
              <div className="mb-6">
                <p className="text-sm font-medium text-ink mb-3">Enter the 6-digit code</p>
                <div className="flex gap-2.5 justify-center">
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
                      className={`w-13 h-16 text-center text-2xl font-bold rounded-xl border-2 bg-surface transition-all duration-200 focus:outline-none ${
                        digit
                          ? "border-accent text-ink"
                          : "border-sand/60 text-ink-muted"
                      } focus:border-accent focus:ring-2 focus:ring-accent/10`}
                      style={{ width: "3.25rem" }}
                    />
                  ))}
                </div>
              </div>

              {/* Verifying */}
              {verifying && (
                <div className="flex items-center justify-center gap-2 text-sm text-ink-muted mb-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </div>
              )}

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20"
                >
                  <p className="text-sm text-error text-center">{error}</p>
                </motion.div>
              )}

              {/* Bottom actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => { setStep("phone"); setError(""); setDevHint(""); }}
                  className="text-sm font-medium text-ink-muted hover:text-ink transition-colors py-2 px-3 -ml-3 rounded-lg hover:bg-sand/20"
                >
                  Change number
                </button>
                <button
                  onClick={handleResend}
                  disabled={countdown > 0}
                  className={`flex items-center gap-1.5 text-sm font-medium py-2 px-3 -mr-3 rounded-lg transition-all ${
                    countdown > 0
                      ? "text-ink-muted/50 cursor-default"
                      : "text-accent hover:text-accent-dark hover:bg-accent/5"
                  }`}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
                </button>
              </div>
            </Card>

            {/* Security note */}
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-muted">
              <ShieldCheck className="h-3.5 w-3.5" />
              Code expires in 10 minutes
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
