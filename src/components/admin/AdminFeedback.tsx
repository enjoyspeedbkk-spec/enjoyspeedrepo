"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Star,
  ThumbsUp,
  MessageSquare,
  Eye,
  EyeOff,
  Send,
  ChevronDown,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  SurveyWithBooking,
  ReviewWithBooking,
  FeedbackStats,
  toggleReviewVisibility,
  submitAdminResponse,
} from "@/lib/actions/feedback";
import { formatDate } from "@/lib/format";

interface AdminFeedbackProps {
  surveys: SurveyWithBooking[];
  reviews: ReviewWithBooking[];
  stats: FeedbackStats;
}

type TabType = "all" | "surveys" | "reviews";

const StarRating = ({ rating, max = 5 }: { rating: number; max?: number }) => {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? "fill-accent text-accent" : "text-sand/60"}`}
        />
      ))}
      <span className="text-xs font-medium text-ink-light ml-1">{rating.toFixed(1)}</span>
    </div>
  );
};

const StatCard = ({ label, value, subtitle }: { label: string; value: string | number | React.ReactNode; subtitle?: string }) => (
  <Card padding="md" className="flex flex-col justify-between">
    <p className="text-xs uppercase tracking-wide text-ink-muted font-semibold">{label}</p>
    <div className="mt-2">
      {typeof value === "string" || typeof value === "number" ? (
        <p className="text-2xl font-bold text-ink">{value}</p>
      ) : (
        <div>{value}</div>
      )}
    </div>
    {subtitle && <p className="text-xs text-ink-light mt-1">{subtitle}</p>}
  </Card>
);

export function AdminFeedback({ surveys, reviews, stats }: AdminFeedbackProps) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<TabType>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggleVisibility = async (reviewId: string, currentIsPublic: boolean) => {
    setTogglingId(reviewId);
    const result = await toggleReviewVisibility(reviewId, !currentIsPublic);
    setTogglingId(null);

    if (result.success) {
      toast.success(`Review is now ${!currentIsPublic ? "public" : "private"}`);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update review visibility");
    }
  };

  const handleSubmitResponse = async (reviewId: string) => {
    const response = responseText[reviewId];
    if (!response?.trim()) {
      toast.warning("Please enter a response");
      return;
    }

    setSubmittingId(reviewId);
    const result = await submitAdminResponse(reviewId, response);
    setSubmittingId(null);

    if (result.success) {
      toast.success("Response submitted successfully");
      setResponseText((prev) => ({ ...prev, [reviewId]: "" }));
      router.refresh();
    } else {
      toast.error(result.error || "Failed to submit response");
    }
  };

  const allFeedback = [...surveys, ...reviews].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const displayData =
    tab === "surveys" ? surveys : tab === "reviews" ? reviews : allFeedback;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Feedback & Reviews</h1>
        <p className="text-sm text-ink-muted mt-1">
          Manage ride surveys and customer reviews
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Responses"
          value={stats.totalResponses}
          subtitle={`${stats.totalSurveys} surveys, ${stats.totalReviews} reviews`}
        />
        <StatCard
          label="Average Rating"
          value={<StarRating rating={stats.avgRating} />}
          subtitle={`${stats.engagedCount} positive feedback`}
        />
        <StatCard
          label="Would Recommend"
          value={`${stats.wouldRecommendPct}%`}
          subtitle="From surveys"
        />
        <StatCard
          label="NPS Score"
          value={stats.npsScore}
          subtitle={stats.npsScore >= 0 ? "Strong" : "Needs improvement"}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-sand/60 flex gap-6">
        {(["all", "surveys", "reviews"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-accent text-accent"
                : "border-transparent text-ink-light hover:text-ink"
            }`}
          >
            {t === "all"
              ? `All (${allFeedback.length})`
              : t === "surveys"
                ? `Surveys (${surveys.length})`
                : `Reviews (${reviews.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {displayData.length === 0 ? (
          <Card padding="md" className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-sand/60 mx-auto mb-3" />
            <p className="text-ink-muted">No feedback yet</p>
          </Card>
        ) : (
          displayData.map((item, idx) => {
            const isSurvey = "guide_rating" in item;
            const isReview = "admin_response" in item;

            if (isSurvey) {
              const survey = item as SurveyWithBooking;
              return (
                <Card key={`survey-${survey.id}`} padding="md" className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-ink">{survey.bookings.contact_name}</p>
                        <Badge variant="default">Ride Survey</Badge>
                      </div>
                      <p className="text-xs text-ink-muted">
                        {formatDate(survey.created_at)} • Booking: {survey.booking_id.slice(0, 8)}
                      </p>
                    </div>
                  </div>

                  {/* Ratings */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3 border-y border-sand/30">
                    <div className="space-y-1">
                      <p className="text-xs text-ink-muted font-medium">Overall</p>
                      <StarRating rating={survey.overall_rating} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-ink-muted font-medium">Guide</p>
                      <StarRating rating={survey.guide_rating} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-ink-muted font-medium">Route</p>
                      <StarRating rating={survey.route_rating} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-ink-muted font-medium">Equipment</p>
                      <StarRating rating={survey.equipment_rating} />
                    </div>
                  </div>

                  {/* Feedback */}
                  <div className="space-y-3">
                    {survey.highlight && (
                      <div>
                        <p className="text-xs font-medium text-ink-muted mb-1">Best Part</p>
                        <p className="text-sm text-ink">{survey.highlight}</p>
                      </div>
                    )}
                    {survey.improvement && (
                      <div>
                        <p className="text-xs font-medium text-ink-muted mb-1">Could Improve</p>
                        <p className="text-sm text-ink">{survey.improvement}</p>
                      </div>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {survey.would_recommend && (
                      <Badge variant="success" className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        Would Recommend
                      </Badge>
                    )}
                    {survey.photo_consent && (
                      <Badge variant="sky" className="flex items-center gap-1">
                        Camera
                        <span className="ml-1">Photo consent granted</span>
                      </Badge>
                    )}
                  </div>
                </Card>
              );
            }

            if (isReview) {
              const review = item as ReviewWithBooking;
              const isExpanded = expandedId === review.id;

              return (
                <Card key={`review-${review.id}`} padding="md" className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-ink">{review.bookings.contact_name}</p>
                        <Badge variant="accent">Review</Badge>
                        {review.is_public && (
                          <Badge variant="success">Public</Badge>
                        )}
                      </div>
                      <p className="text-xs text-ink-muted">
                        {formatDate(review.created_at)} • Booking: {review.booking_id.slice(0, 8)}
                      </p>
                    </div>
                    <StarRating rating={review.rating} />
                  </div>

                  {/* Quick answers */}
                  <div className="flex flex-wrap gap-2 py-3 border-y border-sand/30">
                    <Badge
                      variant={review.enjoyed_ride ? "success" : "default"}
                      className="flex items-center gap-1"
                    >
                      {review.enjoyed_ride ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      Enjoyed ride
                    </Badge>
                    <Badge
                      variant={review.gained_skills ? "success" : "default"}
                      className="flex items-center gap-1"
                    >
                      {review.gained_skills ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      Gained skills
                    </Badge>
                    <Badge
                      variant={review.will_return ? "success" : "default"}
                      className="flex items-center gap-1"
                    >
                      {review.will_return ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      Will return
                    </Badge>
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <div>
                      <p className="text-xs font-medium text-ink-muted mb-1">Comment</p>
                      <p className="text-sm text-ink">{review.comment}</p>
                    </div>
                  )}

                  {/* Admin response section */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : review.id)}
                    className="w-full flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-dark transition-colors py-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {review.admin_response ? "Edit Response" : "Add Response"}
                    <ChevronDown
                      className={`h-4 w-4 ml-auto transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="space-y-3 pt-3 border-t border-sand/30">
                      {review.admin_response && (
                        <div className="p-3 bg-sand/30 rounded-lg">
                          <p className="text-xs font-medium text-ink-muted mb-1">Current Response</p>
                          <p className="text-sm text-ink">{review.admin_response}</p>
                        </div>
                      )}
                      <textarea
                        value={responseText[review.id] || ""}
                        onChange={(e) =>
                          setResponseText((prev) => ({
                            ...prev,
                            [review.id]: e.target.value,
                          }))
                        }
                        placeholder="Write a response to this review..."
                        className="w-full px-4 py-3 rounded-lg border border-sand/60 bg-surface text-sm text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                        rows={3}
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={submittingId === review.id}
                            onClick={() => handleSubmitResponse(review.id)}
                          >
                            <Send className="h-4 w-4" />
                            Send Response
                          </Button>
                        </div>
                        <button
                          onClick={() =>
                            handleToggleVisibility(review.id, review.is_public)
                          }
                          disabled={togglingId === review.id}
                          className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                            review.is_public
                              ? "text-success hover:bg-success/10"
                              : "text-ink-light hover:bg-sand/40"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {review.is_public ? (
                            <>
                              <Eye className="h-4 w-4" />
                              Public
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-4 w-4" />
                              Private
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Photo consent */}
                  {review.photo_consent && (
                    <div className="flex items-center gap-2 p-2 bg-sky/10 rounded-lg text-xs text-sky-dark">
                      <span className="font-medium">Camera</span>
                      Photo consent granted
                    </div>
                  )}
                </Card>
              );
            }

            return null;
          })
        )}
      </div>
    </div>
  );
}
