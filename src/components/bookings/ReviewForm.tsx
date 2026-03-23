"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Star,
  ThumbsUp,
  ThumbsDown,
  Send,
  Sparkles,
  TrendingUp,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { submitReview } from "@/lib/actions/bookings";

interface ReviewFormProps {
  bookingId: string;
  onClose: () => void;
}

type ReviewStep = "rating" | "survey" | "comment" | "done";

export function ReviewForm({ bookingId, onClose }: ReviewFormProps) {
  const [step, setStep] = useState<ReviewStep>("rating");
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [enjoyedRide, setEnjoyedRide] = useState<boolean | null>(null);
  const [gainedSkills, setGainedSkills] = useState<boolean | null>(null);
  const [willReturn, setWillReturn] = useState<boolean | null>(null);
  const [nextSteps, setNextSteps] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    const result = await submitReview(bookingId, {
      rating,
      enjoyedRide: enjoyedRide ?? true,
      gainedSkills: gainedSkills ?? false,
      willReturn: willReturn ?? false,
      nextSteps,
      comment,
    });

    setSubmitting(false);

    if (result.success) {
      setStep("done");
    } else {
      setError(result.error || "Could not submit review.");
    }
  };

  const ratingLabels = ["", "Not great", "Could be better", "Good", "Really enjoyed it", "Absolutely amazing!"];

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-ink/40 z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-cream rounded-t-3xl max-h-[85vh] overflow-y-auto shadow-2xl"
      >
        <div className="sticky top-0 bg-cream rounded-t-3xl z-10 pt-3 pb-2 px-6">
          <div className="w-10 h-1 bg-sand rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">
              {step === "done" ? "Thanks!" : "How was your ride?"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-sand/40 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="px-6 pb-8">
          {/* ============ Step 1: Star Rating ============ */}
          {step === "rating" && (
            <div className="text-center py-6">
              <p className="text-sm text-ink-muted mb-6">
                Tap a star to rate your overall experience
              </p>

              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={`h-10 w-10 transition-colors ${
                        star <= (hoveredStar || rating)
                          ? "text-accent fill-accent"
                          : "text-sand stroke-sand"
                      }`}
                    />
                  </button>
                ))}
              </div>

              {(hoveredStar || rating) > 0 && (
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm font-medium text-ink"
                >
                  {ratingLabels[hoveredStar || rating]}
                </motion.p>
              )}

              <div className="mt-8">
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  disabled={rating === 0}
                  onClick={() => setStep("survey")}
                  arrow
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* ============ Step 2: Survey Questions ============ */}
          {step === "survey" && (
            <div className="py-4 space-y-6">
              <p className="text-sm text-ink-muted">
                A few quick questions to help us improve
              </p>

              {/* Q1: Did you enjoy the ride? */}
              <SurveyQuestion
                icon={Sparkles}
                question="Did you enjoy this ride?"
                questionTh="คุณสนุกกับการปั่นในครั้งนี้ หรือไม่"
                value={enjoyedRide}
                onChange={setEnjoyedRide}
              />

              {/* Q2: Did you gain cycling skills? */}
              <SurveyQuestion
                icon={TrendingUp}
                question="Did you learn new cycling skills?"
                questionTh="คุุณได้ทักษะในการปั่นจักรยาน ทริปนี้ เพิ่มขึ้นหรือไม่"
                value={gainedSkills}
                onChange={setGainedSkills}
              />

              {/* Q3: Will you come back? */}
              <SurveyQuestion
                icon={RotateCcw}
                question="Will you make cycling a regular sport?"
                questionTh="คุณคิดว่า คุณจะกลับมาปั่นจักรยาน เป็นกีฬา ประจำหรือไม่"
                value={willReturn}
                onChange={setWillReturn}
              />

              {/* Q4: Next steps */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRight className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-sm font-semibold">
                      What&apos;s your next step for cycling?
                    </p>
                    <p className="text-[10px] text-ink-muted">
                      คุณจะมีก้าวต่อไป สำหรับ จักรยาน หรือไม่
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Book another ride",
                    "Buy my own bike",
                    "Join a cycling group",
                    "Try a longer route",
                    "Not sure yet",
                    "Other",
                  ].map((option) => (
                    <button
                      key={option}
                      onClick={() => setNextSteps(option)}
                      className={`p-3 rounded-xl border-2 text-sm text-left transition-all ${
                        nextSteps === option
                          ? "border-ink bg-ink/5 font-medium"
                          : "border-sand/60 hover:border-ink/20"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => setStep("comment")}
                arrow
              >
                Almost done
              </Button>
            </div>
          )}

          {/* ============ Step 3: Free Comment ============ */}
          {step === "comment" && (
            <div className="py-4 space-y-4">
              <p className="text-sm text-ink-muted">
                Anything else you&apos;d like to share? This helps us make every
                ride better.
              </p>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Your ride experience, suggestions, or a message for your leader..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border-2 border-sand/60 bg-surface text-ink placeholder:text-ink-muted/50 focus:border-ink focus:outline-none transition-colors resize-none"
              />

              {error && (
                <p className="text-sm text-error">{error}</p>
              )}

              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={handleSubmit}
                loading={submitting}
              >
                <Send className="h-4 w-4" />
                Submit Review
              </Button>

              <button
                onClick={handleSubmit}
                className="w-full text-center text-sm text-ink-muted hover:text-ink transition-colors"
              >
                Skip comment & submit
              </button>
            </div>
          )}

          {/* ============ Step 4: Thank You ============ */}
          {step === "done" && (
            <div className="text-center py-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15, stiffness: 200 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mb-4"
              >
                <Sparkles className="h-10 w-10 text-success" />
              </motion.div>

              <h3 className="text-xl font-bold mb-2">Thanks for riding!</h3>
              <p className="text-sm text-ink-muted mb-1">
                Your feedback helps us improve every ride.
              </p>

              {/* Show stars */}
              <div className="flex justify-center gap-1 my-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 ${
                      star <= rating
                        ? "text-accent fill-accent"
                        : "text-sand"
                    }`}
                  />
                ))}
              </div>

              <div className="space-y-2 mt-6">
                <a href="/booking">
                  <Button variant="secondary" size="lg" fullWidth arrow>
                    Book Your Next Ride
                  </Button>
                </a>
                <button
                  onClick={onClose}
                  className="w-full text-center text-sm text-ink-muted hover:text-ink transition-colors py-2"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ======== Survey Question Component ========
function SurveyQuestion({
  icon: Icon,
  question,
  questionTh,
  value,
  onChange,
}: {
  icon: typeof Star;
  question: string;
  questionTh: string;
  value: boolean | null;
  onChange: (val: boolean) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-accent" />
        <div>
          <p className="text-sm font-semibold">{question}</p>
          <p className="text-[10px] text-ink-muted">{questionTh}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(true)}
          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
            value === true
              ? "border-success bg-success/5 text-success"
              : "border-sand/60 hover:border-ink/20"
          }`}
        >
          <ThumbsUp className="h-4 w-4" />
          Yes
        </button>
        <button
          onClick={() => onChange(false)}
          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
            value === false
              ? "border-error bg-error/5 text-error"
              : "border-sand/60 hover:border-ink/20"
          }`}
        >
          <ThumbsDown className="h-4 w-4" />
          Not really
        </button>
      </div>
    </div>
  );
}
