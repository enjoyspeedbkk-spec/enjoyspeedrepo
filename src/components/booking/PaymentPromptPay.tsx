"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  generatePromptPayPayload,
  getPromptPayQRDataUrl,
} from "@/lib/promptpay";
import {
  QrCode,
  Copy,
  CheckCircle2,
  Clock,
  Upload,
  MessageCircle,
  Gift,
  AlertCircle,
  RotateCcw,
  Phone,
  Bike,
} from "lucide-react";
import { STARTER_KIT, LINE_OA } from "@/lib/constants";
import { SlipUpload } from "@/components/booking/SlipUpload";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface PaymentPromptPayProps {
  bookingId: string;
  amount: number;
  rentalAmount: number;
  promptPayTarget: string; // Phone number or national ID registered with PromptPay
  contactName: string;
}

export function PaymentPromptPay({
  bookingId,
  amount,
  rentalAmount,
  promptPayTarget,
  contactName,
}: PaymentPromptPayProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [slipUploaded, setSlipUploaded] = useState(false);
  const [slipUrl, setSlipUrl] = useState<string | null>(null);

  // 30-minute countdown timer
  const [secondsLeft, setSecondsLeft] = useState(30 * 60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const timerMinutes = Math.floor(secondsLeft / 60);
  const timerSeconds = secondsLeft % 60;
  const timerExpired = secondsLeft === 0;
  const timerUrgent = secondsLeft < 5 * 60; // last 5 min

  const payload = useMemo(
    () =>
      generatePromptPayPayload({
        target: promptPayTarget,
        amount,
      }),
    [promptPayTarget, amount]
  );

  const [qrUrl, setQrUrl] = useState<string>("");
  const [qrError, setQrError] = useState(false);

  useEffect(() => {
    getPromptPayQRDataUrl(payload, 400)
      .then(setQrUrl)
      .catch(() => setQrError(true));
  }, [payload]);

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(amount.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(promptPayTarget.replace(/\D/g, ""));
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleSlipUploaded = (url: string) => {
    setSlipUrl(url);
    setSlipUploaded(true);
  };

  return (
    <section className="min-h-screen pt-24 pb-16 bg-cream">
      <div className="mx-auto max-w-lg px-6">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold">{t('booking.bookingCreated')}</h1>
          <p className="mt-2 text-ink-muted text-sm">
            {t('booking.completionMessage', { name: contactName })}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            {t('booking.bookingNumber', { id: bookingId.slice(0, 8).toUpperCase() })}
          </p>
        </div>

        {/* Payment breakdown — clear split between now vs track */}
        {rentalAmount > 0 && (
          <Card padding="md" className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">{t('booking.reviewBooking')}</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/5 border border-accent/20">
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-accent" />
                  <span className="text-sm font-semibold text-ink">{t('booking.scanToPay')}</span>
                </div>
                <span className="text-sm font-bold text-accent">{amount.toLocaleString()} THB</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-sky/5 border border-sky/20">
                <div className="flex items-center gap-2">
                  <Bike className="h-4 w-4 text-sky" />
                  <div>
                    <span className="text-sm font-semibold text-ink">{t('booking.bikeRentalPayment', { amount: rentalAmount.toLocaleString() }).split(' THB')[0]}</span>
                    <p className="text-xs text-ink-muted">{t('booking.paidSeparatelyAtTrack')}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-sky">{rentalAmount.toLocaleString()} THB</span>
              </div>
              <div className="space-y-2 pt-2 border-t border-sand/40">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-ink">Total for your ride</span>
                  <span className="text-sm font-bold text-ink">{(amount + rentalAmount).toLocaleString()} THB</span>
                </div>
                <p className="text-xs text-ink-muted">Split into two payments</p>
              </div>
            </div>
          </Card>
        )}

        {/* QR Code */}
        <Card padding="lg" className="text-center mb-6">
          <Badge variant="accent" className="mb-4">
            {t('payment.scanToPayQR')}
          </Badge>
          <div className="bg-white rounded-2xl p-4 inline-block mx-auto mb-4 shadow-sm">
            {qrUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={qrUrl}
                alt={t('payment.qrCodeLabel')}
                width={280}
                height={280}
                className="mx-auto"
              />
            ) : qrError ? (
              <div className="w-[280px] h-[280px] mx-auto flex flex-col items-center justify-center gap-3 px-6">
                <AlertCircle className="h-10 w-10 text-error/60" />
                <p className="text-sm font-medium text-ink text-center">
                  QR code failed to load
                </p>
                <p className="text-xs text-ink-muted text-center">
                  {t('booking.openYourBankingApp')}
                </p>
                <button
                  onClick={() => {
                    setQrError(false);
                    setQrUrl("");
                    getPromptPayQRDataUrl(payload, 400)
                      .then(setQrUrl)
                      .catch(() => setQrError(true));
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-dark transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Try again
                </button>
              </div>
            ) : (
              <div className="w-[280px] h-[280px] mx-auto flex flex-col items-center justify-center gap-2">
                <QrCode className="h-12 w-12 text-sand animate-pulse" />
                <p className="text-xs text-ink-muted">Generating QR code...</p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-accent">
              {amount.toLocaleString()} THB
            </p>
            <button
              onClick={handleCopyAmount}
              className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  {t('payment.amount', { amount: 'Copied' }).replace('{amount} THB', 'Copied')}
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  {t('booking.copyAmount')}
                </>
              )}
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-sand/60 text-xs text-ink-muted space-y-2">
            <p>{t('booking.openYourBankingApp')}</p>
            <div className="bg-sand/20 rounded-lg p-3 text-left">
              <p className="text-xs uppercase text-ink-muted/60 tracking-wide mb-1">{t('booking.transferTo')}</p>
              <p className="text-sm font-semibold text-ink">En-Joy Speed — PromptPay</p>
              <div className="flex items-center justify-between mt-1">
                <p className="font-mono text-sm text-ink-light">{promptPayTarget}</p>
                <button
                  onClick={handleCopyAccount}
                  className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink transition-colors"
                >
                  {copiedAccount ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-success" />
                      {t('booking.copyAccount')}
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      {t('booking.copyAccount')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Split payment reminder — only show if there's a rental */}
        {rentalAmount > 0 && (
          <div className="p-4 rounded-xl bg-sky/5 border border-sky/20 mb-6">
            <p className="text-sm font-medium text-ink mb-1">{t('payment.paymentCountdown')}</p>
            <p className="text-xs text-ink-muted">
              {t('payment.paymentHeld')}
            </p>
          </div>
        )}

        {/* Payment countdown timer */}
        <div className={`p-4 rounded-xl border mb-6 ${
          timerExpired ? "bg-error/5 border-error/20" : timerUrgent ? "bg-warning/10 border-warning/30" : "bg-sand/20 border-sand/40"
        }`}>
          <div className="flex items-center gap-3">
            <Clock className={`h-5 w-5 flex-shrink-0 ${timerExpired ? "text-error" : timerUrgent ? "text-warning" : "text-ink-muted"}`} />
            <div className="flex-1">
              <p className={`text-sm font-bold ${timerExpired ? "text-error" : "text-ink"}`}>
                {timerExpired ? t('booking.timeExpired') : timerUrgent ? t('payment.hurryTimeRunningOut') : t('payment.paymentCountdown')}
              </p>
              <p className="text-xs text-ink-muted mt-0.5">
                {timerExpired
                  ? t('booking.yourSlotMayHaveBeenReleased')
                  : t('payment.paymentHeld')}
              </p>
            </div>
            {!timerExpired && (
              <span className={`font-mono text-lg font-bold tabular-nums ${timerUrgent ? "text-warning" : "text-ink"}`}>
                {timerMinutes}:{timerSeconds.toString().padStart(2, "0")}
              </span>
            )}
          </div>

          {/* Recovery options when expired */}
          {timerExpired && (
            <div className="mt-4 pt-3 border-t border-error/10 space-y-2">
              <p className="text-xs font-medium text-ink">What you can do:</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Link
                  href="/booking"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-dark transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  Book again
                </Link>
                <a
                  href={`https://line.me/R/ti/p/${LINE_OA}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-ink/15 text-ink text-sm font-semibold hover:bg-sand/30 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  {t('payment.contactUS')}
                </a>
              </div>
              <p className="text-xs text-ink-muted">
                Already paid? No worries — contact us on LINE and we'll confirm your booking manually.
              </p>
            </div>
          )}
        </div>

        {/* Upload slip (optional) */}
        <Card padding="md" className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-ink-muted" />
              <span className="text-sm font-semibold text-ink">{t('payment.uploadSlip')}</span>
            </div>
            <span className="text-xs font-medium text-ink-muted/70 bg-sand/30 px-2 py-0.5 rounded-full">{t('booking.optional')}</span>
          </div>
          <p className="text-xs text-ink-muted mb-3">{t('payment.uploadDesc')}</p>
          <SlipUpload
            bookingId={bookingId}
            onUploaded={handleSlipUploaded}
          />
        </Card>

        {/* Rental reminder for no-rental bookings */}
        {rentalAmount === 0 && (
          <div className="p-3 rounded-xl bg-success/5 border border-success/20 mb-6">
            <p className="text-sm font-medium text-ink">{t('booking.noRentalNeeded')}</p>
            <p className="text-xs text-ink-muted mt-0.5">
              You&apos;re bringing your own bike. Total cost is {amount.toLocaleString()} THB.
            </p>
          </div>
        )}

        {/* Starter Kit reminder */}
        <div className="p-3 rounded-xl bg-success/5 border border-success/20 mb-6">
          <div className="flex items-start gap-2">
            <Gift className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-ink">
                {t('booking.yourStarterKitIsIncluded')}
              </p>
              <p className="text-xs text-ink-muted mt-0.5">
                {STARTER_KIT.join(" · ")}
              </p>
              <p className="text-xs text-ink-muted">
                {t('booking.yoursToKeepAfterRide')}
              </p>
            </div>
          </div>
        </div>

        {/* Next steps */}
        <Card padding="md">
          <h3 className="font-semibold text-sm mb-3">{t('payment.nextSteps')}</h3>
          <div className="space-y-3">
            {[
              {
                step: "1",
                text: t('payment.step1'),
              },
              {
                step: "2",
                text: t('payment.step2', { line: LINE_OA }),
              },
              {
                step: "3",
                text: t('payment.step3'),
              },
              {
                step: "4",
                text: t('payment.step4'),
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-ink text-cream text-xs font-bold flex-shrink-0">
                  {item.step}
                </span>
                <p className="text-sm text-ink-light pt-0.5">{item.text}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* LINE follow CTA */}
        <Card padding="md" className="mt-6 bg-[#06C755]/5 border-[#06C755]/20">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#06C755] flex-shrink-0">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">{t('payment.nextSteps')}</p>
              <p className="text-xs text-ink-muted mt-0.5">
                Follow @enjoyspeed for booking confirmations, ride-day reminders, weather alerts, and instant support.
              </p>
              <a
                href={`https://line.me/R/ti/p/${LINE_OA}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 rounded-lg bg-[#06C755] text-white text-xs font-semibold hover:bg-[#05b34e] transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Add @enjoyspeed on LINE
              </a>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
