"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Heart, ThumbsUp, Camera, Send, CheckCircle2, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { submitSurvey } from "@/lib/actions/survey";

interface SurveyFormProps {
  bookingId: string;
  contactName: string;
}

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Great", "Amazing"];

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div>
      <p className="text-sm font-medium text-ink mb-2">{label}</p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star)}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star
              className={`h-8 w-8 transition-colors ${
                star <= (hover || value)
                  ? "fill-accent text-accent"
                  : "text-sand/60"
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-ink-muted">
          {RATING_LABELS[hover || value] || ""}
        </span>
      </div>
    </div>
  );
}

export function SurveyForm({ bookingId, contactName }: SurveyFormProps) {
  const [step, setStep] = useState(0); // 0=ratings, 1=text, 2=recommend, 3=done
  const [overall, setOverall] = useState(0);
  const [guide, setGuide] = useState(0);
  const [route, setRoute] = useState(0);
  const [equipment, setEquipment] = useState(0);
  const [highlight, setHighlight] = useState("");
  const [improvement, setImprovement] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [photoConsent, setPhotoConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (overall === 0) return;
    setSubmitting(true);
    setError("");

    const result = await submitSurvey({
      bookingId,
      overallRating: overall,
      guideRating: guide || overall,
      routeRating: route || overall,
      equipmentRating: equipment || overall,
      highlight,
      improvement,
      wouldRecommend: wouldRecommend ?? true,
      photoConsent,
    });

    setSubmitting(false);

    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error || "Could not submit. Please try again.");
    }
  };

  if (submitted) {
    return (
      <section className="min-h-screen pt-24 pb-16 bg-cream">
        <div className="mx-auto max-w-md px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mb-6">
              <Heart className="h-10 w-10 text-success fill-success" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Thank you!</h1>
            <p className="text-ink-muted">
              Your feedback helps us make every ride better.
              {wouldRecommend && " We'd love to see you again soon!"}
            </p>
            <div className="mt-8">
              <a
                href="/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent-dark transition-colors"
              >
                Book another ride
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-24 pb-16 bg-cream">
      <div className="mx-auto max-w-md px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">How was your ride?</h1>
          {contactName && (
            <p className="text-ink-muted mt-1">
              Thanks for riding with us, {contactName}!
            </p>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i === step
                  ? "bg-accent w-8"
                  : i < step
                  ? "bg-success"
                  : "bg-sand/60"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Star Ratings */}
          {step === 0 && (
            <motion.div
              key="ratings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card padding="lg" className="space-y-6">
                <StarRating
                  value={overall}
                  onChange={setOverall}
                  label="Overall experience"
                />
                <StarRating
                  value={guide}
                  onChange={setGuide}
                  label="Your guide / Athlete Leader"
                />
                <StarRating
                  value={route}
                  onChange={setRoute}
                  label="Route & scenery"
                />
                <StarRating
                  value={equipment}
                  onChange={setEquipment}
                  label="Bike & equipment"
                />
              </Card>
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => setStep(1)}
                disabled={overall === 0}
                className="mt-4"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* Step 1: Text Feedback */}
          {step === 1 && (
            <motion.div
              key="text"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card padding="lg" className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">
                    What was the best part of your ride?
                  </label>
                  <textarea
                    value={highlight}
                    onChange={(e) => setHighlight(e.target.value)}
                    placeholder="The sunset was incredible..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-sand/60 bg-surface text-ink placeholder:text-ink-muted/40 focus:border-ink focus:outline-none transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">
                    Anything we could improve?
                  </label>
                  <textarea
                    value={improvement}
                    onChange={(e) => setImprovement(e.target.value)}
                    placeholder="Optional — helps us get better"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-sand/60 bg-surface text-ink placeholder:text-ink-muted/40 focus:border-ink focus:outline-none transition-colors resize-none"
                  />
                </div>
              </Card>
              <div className="mt-4 flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setStep(0)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Recommend + Photo Consent + Submit */}
          {step === 2 && (
            <motion.div
              key="recommend"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card padding="lg" className="space-y-6">
                {/* Would recommend? */}
                <div>
                  <p className="text-sm font-medium text-ink mb-3">
                    Would you recommend En-Joy Speed to a friend?
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setWouldRecommend(true)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                        wouldRecommend === true
                          ? "border-success bg-success/5 text-success"
                          : "border-sand/60 text-ink-muted hover:border-ink/20"
                      }`}
                    >
                      <ThumbsUp className={`h-5 w-5 ${wouldRecommend === true ? "fill-success" : ""}`} />
                      <span className="font-medium text-sm">Yes!</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWouldRecommend(false)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                        wouldRecommend === false
                          ? "border-ink bg-ink/5 text-ink"
                          : "border-sand/60 text-ink-muted hover:border-ink/20"
                      }`}
                    >
                      <span className="font-medium text-sm">Not sure</span>
                    </button>
                  </div>
                </div>

                {/* Photo consent */}
                <button
                  type="button"
                  onClick={() => setPhotoConsent(!photoConsent)}
                  className={`flex items-start gap-3 w-full p-4 rounded-xl border-2 text-left transition-all ${
                    photoConsent
                      ? "border-accent bg-accent/5"
                      : "border-sand/60 hover:border-ink/20"
                  }`}
                >
                  <Camera className={`h-5 w-5 mt-0.5 flex-shrink-0 ${photoConsent ? "text-accent" : "text-ink-muted"}`} />
                  <div>
                    <p className="text-sm font-medium text-ink">
                      Share my ride photos on social media
                    </p>
                    <p className="text-xs text-ink-muted mt-0.5">
                      We&apos;d love to feature you on our Instagram! You can always change your mind.
                    </p>
                  </div>
                </button>
              </Card>

              {error && (
                <div className="mt-3 p-3 rounded-lg bg-error/5 text-error text-sm">
                  {error}
                </div>
              )}

              <div className="mt-4 flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleSubmit}
                  loading={submitting}
                  disabled={wouldRecommend === null || submitting}
                  className="flex-1"
                >
                  <Send className="h-4 w-4" />
                  Submit
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
