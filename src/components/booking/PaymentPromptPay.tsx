"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  generatePromptPayPayload,
  getPromptPayQRUrl,
} from "@/lib/promptpay";
import {
  QrCode,
  Copy,
  CheckCircle2,
  Clock,
  Upload,
  MessageCircle,
  Gift,
} from "lucide-react";
import { STARTER_KIT, LINE_OA } from "@/lib/constants";
import { SlipUpload } from "@/components/booking/SlipUpload";

interface PaymentPromptPayProps {
  bookingId: string;
  amount: number;
  rentalAmount: number;
  promptPayTarget: string; // Phone, Tax ID, or bank account
  promptPayBankCode?: string; // Bank code (default "004" for KBank)
  contactName: string;
}

export function PaymentPromptPay({
  bookingId,
  amount,
  rentalAmount,
  promptPayTarget,
  promptPayBankCode = "004",
  contactName,
}: PaymentPromptPayProps) {
  const [copied, setCopied] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [slipUploaded, setSlipUploaded] = useState(false);
  const [slipUrl, setSlipUrl] = useState<string | null>(null);

  const payload = useMemo(
    () =>
      generatePromptPayPayload({
        target: promptPayTarget,
        amount,
        bankCode: promptPayBankCode,
      }),
    [promptPayTarget, amount, promptPayBankCode]
  );

  const qrUrl = useMemo(
    () => getPromptPayQRUrl(payload, 400),
    [payload]
  );

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(amount.toFixed(2));
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
          <h1 className="text-2xl font-bold">Booking created!</h1>
          <p className="mt-2 text-ink-muted text-sm">
            Hi {contactName}, complete payment to confirm your ride.
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Booking #{bookingId.slice(0, 8).toUpperCase()}
          </p>
        </div>

        {/* QR Code */}
        <Card padding="lg" className="text-center mb-6">
          <Badge variant="accent" className="mb-4">
            Scan to Pay
          </Badge>
          <div className="bg-white rounded-2xl p-4 inline-block mx-auto mb-4 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="PromptPay QR Code"
              width={280}
              height={280}
              className="mx-auto"
            />
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
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy amount
                </>
              )}
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-sand/60 text-xs text-ink-muted space-y-2">
            <p>Open your banking app, scan this QR, and the amount will auto-fill.</p>
            <div className="bg-sand/20 rounded-lg p-3 text-left">
              <p className="text-[10px] uppercase text-ink-muted/60 tracking-wide mb-1">Transfer to</p>
              <p className="text-sm font-semibold text-ink">Pailin — KBank (Kasikorn)</p>
              <div className="flex items-center justify-between mt-1">
                <p className="font-mono text-sm text-ink-light">{promptPayTarget}</p>
                <button
                  onClick={handleCopyAccount}
                  className="inline-flex items-center gap-1 text-[10px] text-ink-muted hover:text-ink transition-colors"
                >
                  {copiedAccount ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-success" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Payment timer */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-warning/5 border border-warning/20 mb-6">
          <Clock className="h-5 w-5 text-warning flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-ink">
              Pay within 30 minutes
            </p>
            <p className="text-xs text-ink-muted">
              Your booking will be held for 30 minutes. After that, the slot may
              be released.
            </p>
          </div>
        </div>

        {/* Upload slip */}
        <Card padding="md" className="mb-6">
          <SlipUpload
            bookingId={bookingId}
            onUploaded={handleSlipUploaded}
          />
        </Card>

        {rentalAmount > 0 && (
          <div className="p-3 rounded-xl bg-sky/5 border border-sky/20 mb-6">
            <p className="text-sm font-medium text-ink">
              Bike rental: {rentalAmount.toLocaleString()} THB
            </p>
            <p className="text-xs text-ink-muted mt-1">
              Paid separately at the track to HHBL on ride day. No need to pay
              now.
            </p>
          </div>
        )}

        {/* Starter Kit reminder */}
        <div className="p-3 rounded-xl bg-success/5 border border-success/20 mb-6">
          <div className="flex items-start gap-2">
            <Gift className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-ink">
                Your Starter Kit is included
              </p>
              <p className="text-xs text-ink-muted mt-0.5">
                {STARTER_KIT.join(" · ")}
              </p>
              <p className="text-xs text-ink-muted">
                Yours to keep after the ride.
              </p>
            </div>
          </div>
        </div>

        {/* Next steps */}
        <Card padding="md">
          <h3 className="font-semibold text-sm mb-3">What happens next</h3>
          <div className="space-y-3">
            {[
              {
                step: "1",
                text: "We verify your payment (usually within 15 min)",
              },
              {
                step: "2",
                text: `You'll get a confirmation via LINE (${LINE_OA})`,
              },
              {
                step: "3",
                text: "We send your ride prep guide 24 hours before",
              },
              {
                step: "4",
                text: "Show up, ride, and enjoy!",
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

        {/* LINE contact */}
        <div className="mt-6 text-center">
          <a
            href={`https://line.me/R/ti/p/${LINE_OA}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-success hover:text-success/80 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Questions? Chat with us on LINE
          </a>
        </div>
      </div>
    </section>
  );
}
