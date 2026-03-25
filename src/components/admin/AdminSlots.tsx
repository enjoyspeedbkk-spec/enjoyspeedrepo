"use client";

import { useState } from "react";
import {
  CalendarDays,
  Clock,
  CloudRain,
  Sun,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Users,
  Plus,
  Ban,
  Trash2,
  Sunrise,
  Sunset,
  Check,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  toggleSessionAvailability,
  updateWeatherStatus,
  addBlackoutDate,
  deleteBlackoutDate,
} from "@/lib/actions/admin";
import { TIME_SLOTS } from "@/lib/constants";

interface Session {
  id: string;
  date: string;
  time_slot_id: string;
  is_available: boolean;
  weather_status: string | null;
  weather_note: string | null;
  max_groups: number;
}

interface SessionBooking {
  ride_session_id: string;
  status: string;
  rider_count: number;
  group_type: string;
  contact_name: string;
}

interface BlackoutDate {
  id: string;
  date: string;
  reason: string;
  affects_slots: string[];
}

// Group slots by period for display
const MORNING_SLOTS = TIME_SLOTS.filter((s) => s.period === "morning");
const EVENING_SLOTS = TIME_SLOTS.filter((s) => s.period === "evening");

export function AdminSlots({
  initialSessions,
  initialBookings,
  initialBlackouts,
}: {
  initialSessions: Session[];
  initialBookings: SessionBooking[];
  initialBlackouts: BlackoutDate[];
}) {
  const toast = useToast();
  const [sessions, setSessions] = useState(initialSessions);
  const [bookings] = useState(initialBookings);
  const [blackouts, setBlackouts] = useState(initialBlackouts);
  const [weekOffset, setWeekOffset] = useState(0);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showBlackoutForm, setShowBlackoutForm] = useState(false);
  const [blackoutDate, setBlackoutDate] = useState("");
  const [blackoutReason, setBlackoutReason] = useState("");
  const [blackoutSlots, setBlackoutSlots] = useState<string[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    blackoutId: string;
    reason: string;
    date: string;
  } | null>(null);

  // Build date range for current week view
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() + weekOffset * 7);
  const dayOfWeek = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push(d);
  }

  const formatDateKey = (d: Date) => d.toISOString().split("T")[0];

  // Group sessions by date
  const sessionsByDate = new Map<string, Session[]>();
  sessions.forEach((s) => {
    const existing = sessionsByDate.get(s.date) || [];
    existing.push(s);
    sessionsByDate.set(s.date, existing);
  });

  // Group bookings by session
  const bookingsBySession = new Map<string, SessionBooking[]>();
  bookings.forEach((b) => {
    const existing = bookingsBySession.get(b.ride_session_id) || [];
    existing.push(b);
    bookingsBySession.set(b.ride_session_id, existing);
  });

  // Blackouts by date
  const blackoutsByDate = new Map<string, BlackoutDate[]>();
  blackouts.forEach((b) => {
    const existing = blackoutsByDate.get(b.date) || [];
    existing.push(b);
    blackoutsByDate.set(b.date, existing);
  });

  const handleToggleAvailability = async (sessionId: string, current: boolean) => {
    setUpdating(sessionId);
    const result = await toggleSessionAvailability(sessionId, !current);
    if (result.success) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, is_available: !current } : s
        )
      );
      toast.success(current ? "Slot disabled" : "Slot enabled");
    } else {
      toast.error("Failed to update slot availability");
    }
    setUpdating(null);
  };

  const handleWeatherUpdate = async (
    sessionId: string,
    status: "clear" | "warning" | "cancelled",
    note?: string
  ) => {
    setUpdating(sessionId);
    const result = await updateWeatherStatus(sessionId, status, note);
    if (result.success) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, weather_status: status, weather_note: note || null }
            : s
        )
      );
      toast.success(`Weather updated to ${status}`);
    } else {
      toast.error("Failed to update weather status");
    }
    setUpdating(null);
  };

  const handleAddBlackout = async () => {
    if (!blackoutDate || !blackoutReason) return;
    setUpdating("blackout");
    const result = await addBlackoutDate(
      blackoutDate,
      blackoutReason,
      blackoutSlots.length > 0 ? blackoutSlots : undefined
    );
    if (result.success) {
      setBlackouts((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          date: blackoutDate,
          reason: blackoutReason,
          affects_slots: blackoutSlots,
        },
      ]);
      setBlackoutDate("");
      setBlackoutReason("");
      setBlackoutSlots([]);
      setShowBlackoutForm(false);
      toast.success("Blackout date added");
    } else {
      toast.error("Failed to add blackout date");
    }
    setUpdating(null);
  };

  const handleRemoveBlackout = async (id: string) => {
    setUpdating(id);
    const result = await deleteBlackoutDate(id);
    if (result.success) {
      setBlackouts((prev) => prev.filter((b) => b.id !== id));
      toast.success("Blackout date removed");
    } else {
      toast.error("Failed to remove blackout date");
    }
    setUpdating(null);
  };

  const isToday = (d: Date) => formatDateKey(d) === formatDateKey(today);
  const isPast = (d: Date) => formatDateKey(d) < formatDateKey(today);

  // Get day summary stats
  const getDaySummary = (dateKey: string) => {
    const daySessions = sessionsByDate.get(dateKey) || [];
    let totalBookings = 0;
    let totalRiders = 0;
    daySessions.forEach((s) => {
      const sBookings = bookingsBySession.get(s.id) || [];
      totalBookings += sBookings.length;
      totalRiders += sBookings.reduce((sum, b) => sum + b.rider_count, 0);
    });
    const availableSlots = daySessions.filter((s) => s.is_available).length;
    return { totalBookings, totalRiders, availableSlots, totalSlots: daySessions.length };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Slots & Availability</h1>
          <p className="text-sm text-ink-muted mt-1">
            Manage daily ride slots, weather status, and blackout dates
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowBlackoutForm(!showBlackoutForm)}
        >
          <Ban className="h-3.5 w-3.5" />
          Add Blackout
        </Button>
      </div>

      {/* Blackout form */}
      {showBlackoutForm && (
        <Card padding="md" className="border-warning/30 bg-warning/5">
          <p className="font-bold text-sm text-ink mb-3">Add Blackout Date</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-ink mb-1.5 block">Date</label>
              <input
                type="date"
                value={blackoutDate}
                onChange={(e) => setBlackoutDate(e.target.value)}
                min={formatDateKey(today)}
                className="w-full px-3 py-2.5 rounded-lg border-2 border-sand/60 text-sm font-medium focus:border-ink focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink mb-1.5 block">Reason</label>
              <input
                type="text"
                value={blackoutReason}
                onChange={(e) => setBlackoutReason(e.target.value)}
                placeholder="e.g. Holiday, Private event..."
                className="w-full px-3 py-2.5 rounded-lg border-2 border-sand/60 text-sm focus:border-ink focus:outline-none transition-colors placeholder:text-ink-muted/60"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink mb-1.5 block">
                Affected Slots
              </label>
              <p className="text-xs text-ink-muted mb-2">Leave empty to block all slots</p>
              <div className="flex gap-2 flex-wrap">
                {TIME_SLOTS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() =>
                      setBlackoutSlots((prev) =>
                        prev.includes(s.id)
                          ? prev.filter((x) => x !== s.id)
                          : [...prev, s.id]
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      blackoutSlots.includes(s.id)
                        ? "bg-ink text-cream"
                        : "bg-sand/40 text-ink-muted hover:bg-sand/60"
                    }`}
                  >
                    {s.id} — {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              onClick={handleAddBlackout}
              disabled={!blackoutDate || !blackoutReason || updating === "blackout"}
            >
              {updating === "blackout" ? <><Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1" /> Adding…</> : "Add Blackout"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBlackoutForm(false)}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Week navigation */}
      <div className="flex items-center justify-between bg-surface rounded-xl border border-sand/60 p-3">
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          className="p-2 rounded-lg hover:bg-sand/40 transition-colors"
          aria-label="Previous week"
        >
          <ChevronLeft className="h-5 w-5 text-ink" />
        </button>
        <div className="text-center">
          <p className="font-bold text-ink">
            {days[0].toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
            })}{" "}
            –{" "}
            {days[6].toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs font-medium text-accent hover:text-accent-dark mt-0.5"
            >
              Jump to this week
            </button>
          )}
        </div>
        <button
          onClick={() => setWeekOffset((w) => w + 1)}
          className="p-2 rounded-lg hover:bg-sand/40 transition-colors"
          aria-label="Next week"
        >
          <ChevronRight className="h-5 w-5 text-ink" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-ink-muted px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-success" /> Open with bookings
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sand/80" /> Open, no bookings
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-ink/30" /> Disabled
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-warning" /> Blacked out
        </span>
      </div>

      {/* Calendar grid — one card per day */}
      <div className="space-y-3">
        {days.map((day) => {
          const dateKey = formatDateKey(day);
          const daySessions = sessionsByDate.get(dateKey) || [];
          const dayBlackouts = blackoutsByDate.get(dateKey) || [];
          const past = isPast(day);
          const todayHL = isToday(day);
          const summary = getDaySummary(dateKey);

          return (
            <div
              key={dateKey}
              className={`rounded-2xl border overflow-hidden transition-all ${
                todayHL
                  ? "border-accent/40 shadow-md"
                  : past
                  ? "border-sand/40 opacity-50"
                  : "border-sand/60"
              }`}
            >
              {/* Day header bar */}
              <div
                className={`px-4 py-3 flex items-center justify-between ${
                  todayHL ? "bg-accent/10" : "bg-ink/[0.03]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                      todayHL
                        ? "bg-accent text-cream"
                        : "bg-sand/50 text-ink"
                    }`}
                  >
                    {day.getDate()}
                  </div>
                  <div>
                    <p className="font-bold text-ink text-sm">
                      {day.toLocaleDateString("en-US", { weekday: "long" })}
                      {todayHL && (
                        <span className="ml-2 text-xs font-semibold text-accent">Today</span>
                      )}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {day.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>

                {/* Day summary badges */}
                <div className="flex items-center gap-2">
                  {summary.totalBookings > 0 && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success/10 text-success text-xs font-bold">
                      <Users className="h-3.5 w-3.5" />
                      {summary.totalRiders} riders · {summary.totalBookings} booking{summary.totalBookings !== 1 ? "s" : ""}
                    </span>
                  )}
                  {dayBlackouts.length > 0 && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-warning/10 text-warning text-xs font-bold">
                      <Ban className="h-3.5 w-3.5" />
                      Blackout
                    </span>
                  )}
                </div>
              </div>

              {/* Blackout banners */}
              {dayBlackouts.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between px-4 py-2 bg-warning/10 border-b border-warning/20"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <Ban className="h-4 w-4 text-warning flex-shrink-0" />
                    <span className="font-semibold text-warning">{b.reason}</span>
                    {b.affects_slots?.length > 0 ? (
                      <span className="text-ink-muted text-xs">
                        — Affects: {b.affects_slots.map((sid) => {
                          const slot = TIME_SLOTS.find((s) => s.id === sid);
                          return slot ? `${sid} (${slot.label})` : sid;
                        }).join(", ")}
                      </span>
                    ) : (
                      <span className="text-ink-muted text-xs">— All slots</span>
                    )}
                  </div>
                  {!past && (
                    <button
                      onClick={() => setConfirmDialog({ open: true, blackoutId: b.id, reason: b.reason, date: b.date })}
                      disabled={updating === b.id}
                      className="p-1.5 rounded-lg text-ink-muted hover:text-warning hover:bg-warning/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Remove blackout"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}

              {/* Slots body */}
              <div className="p-4 space-y-4 bg-surface">
                {/* Morning slots */}
                {MORNING_SLOTS.length > 0 && (
                  <SlotGroup
                    label="Morning"
                    icon={<Sunrise className="h-4 w-4 text-amber-500" />}
                    slots={MORNING_SLOTS}
                    daySessions={daySessions}
                    bookingsBySession={bookingsBySession}
                    dayBlackouts={dayBlackouts}
                    past={past}
                    updating={updating}
                    onToggle={handleToggleAvailability}
                    onWeather={handleWeatherUpdate}
                  />
                )}

                {/* Evening slots */}
                {EVENING_SLOTS.length > 0 && (
                  <SlotGroup
                    label="Evening"
                    icon={<Sunset className="h-4 w-4 text-orange-500" />}
                    slots={EVENING_SLOTS}
                    daySessions={daySessions}
                    bookingsBySession={bookingsBySession}
                    dayBlackouts={dayBlackouts}
                    past={past}
                    updating={updating}
                    onToggle={handleToggleAvailability}
                    onWeather={handleWeatherUpdate}
                  />
                )}

                {daySessions.length === 0 && (
                  <p className="text-sm text-ink-muted text-center py-4">
                    No sessions created for this date
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active blackouts summary */}
      {blackouts.filter((b) => b.date >= formatDateKey(today)).length > 0 && (
        <div>
          <p className="text-sm font-bold text-ink mb-3">
            Upcoming Blackout Dates
          </p>
          <div className="space-y-2">
            {blackouts
              .filter((b) => b.date >= formatDateKey(today))
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface border border-sand/60 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Ban className="h-4 w-4 text-warning flex-shrink-0" />
                    <span className="font-bold text-ink">
                      {new Date(b.date + "T12:00").toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-ink-muted">{b.reason}</span>
                    {b.affects_slots?.length > 0 && (
                      <Badge variant="default">
                        {b.affects_slots.join(", ")}
                      </Badge>
                    )}
                  </div>
                  <button
                    onClick={() => setConfirmDialog({ open: true, blackoutId: b.id, reason: b.reason, date: b.date })}
                    disabled={updating === b.id}
                    className="p-1.5 rounded-lg text-ink-muted hover:text-warning hover:bg-warning/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Remove blackout"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {confirmDialog && (
        <ConfirmDialog
          open={confirmDialog.open}
          title="Remove blackout date?"
          description={`This will remove the blackout for ${new Date(confirmDialog.date + "T12:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}.`}
          detail={`Reason was: "${confirmDialog.reason}". Slots will become available for bookings again.`}
          variant="warning"
          confirmLabel="Remove Blackout"
          onConfirm={() => {
            handleRemoveBlackout(confirmDialog.blackoutId);
            setConfirmDialog(null);
          }}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}

/* ─── Slot Group (Morning / Evening) ───────────────────────── */

function SlotGroup({
  label,
  icon,
  slots,
  daySessions,
  bookingsBySession,
  dayBlackouts,
  past,
  updating,
  onToggle,
  onWeather,
}: {
  label: string;
  icon: React.ReactNode;
  slots: typeof TIME_SLOTS;
  daySessions: Session[];
  bookingsBySession: Map<string, SessionBooking[]>;
  dayBlackouts: BlackoutDate[];
  past: boolean;
  updating: string | null;
  onToggle: (sessionId: string, current: boolean) => void;
  onWeather: (sessionId: string, status: "clear" | "warning" | "cancelled", note?: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs font-bold text-ink uppercase tracking-wider">{label}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {slots.map((slot) => {
          const session = daySessions.find((s) => s.time_slot_id === slot.id);
          const sessionBookings = session
            ? bookingsBySession.get(session.id) || []
            : [];
          const totalRiders = sessionBookings.reduce(
            (sum, b) => sum + b.rider_count,
            0
          );
          const isBlackedOut = dayBlackouts.some(
            (b) =>
              b.affects_slots.length === 0 ||
              b.affects_slots.includes(slot.id)
          );
          const hasBookings = sessionBookings.length > 0;
          const isDisabled = session && !session.is_available;

          // Determine the status color for the left border
          let borderColor = "border-l-sand/80"; // default open, no bookings
          let bgColor = "bg-surface";
          if (isBlackedOut) {
            borderColor = "border-l-warning";
            bgColor = "bg-warning/5";
          } else if (isDisabled) {
            borderColor = "border-l-ink/20";
            bgColor = "bg-sand/10";
          } else if (hasBookings) {
            borderColor = "border-l-success";
            bgColor = "bg-success/5";
          }

          return (
            <div
              key={slot.id}
              className={`rounded-xl border border-sand/40 border-l-4 ${borderColor} ${bgColor} overflow-hidden transition-all ${
                isDisabled || isBlackedOut ? "opacity-60" : ""
              }`}
            >
              {/* Slot header */}
              <div className="px-3 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-ink/5 flex items-center justify-center font-bold text-xs text-ink">
                    {slot.id}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-ink truncate">{slot.label}</p>
                    <p className="text-xs text-ink-muted flex items-center gap-1">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      {slot.startTime} – {slot.endTime}
                    </p>
                  </div>
                </div>

                {/* Weather & availability controls */}
                {session && !past && !isBlackedOut && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Weather toggle */}
                    <WeatherToggle
                      status={session.weather_status}
                      disabled={updating === session.id}
                      onUpdate={(status) => onWeather(session.id, status)}
                    />
                    {/* Availability toggle */}
                    <button
                      onClick={() => onToggle(session.id, session.is_available)}
                      disabled={updating === session.id}
                      className={`p-1.5 rounded-lg transition-all ${
                        session.is_available
                          ? "text-success hover:bg-success/10"
                          : "text-ink-muted hover:bg-sand/40"
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                      title={session.is_available ? "Slot is open — click to disable" : "Slot is disabled — click to enable"}
                    >
                      {session.is_available ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Status bar */}
              {isBlackedOut && (
                <div className="px-3 py-1.5 bg-warning/10 text-xs font-semibold text-warning">
                  Blacked out
                </div>
              )}
              {isDisabled && !isBlackedOut && (
                <div className="px-3 py-1.5 bg-sand/20 text-xs font-semibold text-ink-muted">
                  Slot disabled
                </div>
              )}
              {session?.weather_status === "warning" && (
                <div className="px-3 py-1.5 bg-amber-50 text-xs font-semibold text-amber-600 flex items-center gap-1.5">
                  <CloudRain className="h-3 w-3" />
                  Weather warning
                </div>
              )}
              {session?.weather_status === "cancelled" && (
                <div className="px-3 py-1.5 bg-red-50 text-xs font-semibold text-red-600 flex items-center gap-1.5">
                  <XCircle className="h-3 w-3" />
                  Cancelled — weather
                </div>
              )}

              {/* Bookings */}
              <div className="px-3 py-2 border-t border-sand/30">
                {hasBookings ? (
                  <div className="space-y-1.5">
                    {sessionBookings.map((b, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="font-medium text-ink truncate">
                          {b.contact_name}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-bold text-ink-muted flex-shrink-0 ml-2">
                          <Users className="h-3 w-3" />
                          {b.rider_count}
                        </span>
                      </div>
                    ))}
                    <p className="text-xs font-bold text-success pt-1 border-t border-sand/20">
                      {totalRiders} total rider{totalRiders !== 1 ? "s" : ""}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-ink-muted py-1">
                    {isBlackedOut
                      ? "Not available"
                      : isDisabled
                      ? "Not accepting bookings"
                      : "No bookings yet"}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Weather Toggle Button ───────────────────────────────── */

function WeatherToggle({
  status,
  disabled,
  onUpdate,
}: {
  status: string | null;
  disabled: boolean;
  onUpdate: (status: "clear" | "warning" | "cancelled") => void;
}) {
  const weatherOptions: { value: "clear" | "warning" | "cancelled"; icon: typeof Sun; label: string; color: string }[] = [
    { value: "clear", icon: Sun, label: "Clear", color: "text-success" },
    { value: "warning", icon: CloudRain, label: "Warning", color: "text-amber-500" },
    { value: "cancelled", icon: XCircle, label: "Cancelled", color: "text-red-500" },
  ];

  const current = status || "clear";
  const nextStatus =
    current === "clear" ? "warning" : current === "warning" ? "cancelled" : "clear";
  const nextOption = weatherOptions.find((o) => o.value === nextStatus)!;
  const currentOption = weatherOptions.find((o) => o.value === current)!;
  const CurrentIcon = currentOption.icon;

  return (
    <button
      onClick={() => onUpdate(nextStatus)}
      disabled={disabled}
      className={`p-1.5 rounded-lg hover:bg-sand/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${currentOption.color}`}
      title={`Weather: ${currentOption.label} — click to set ${nextOption.label}`}
    >
      <CurrentIcon className="h-4 w-4" />
    </button>
  );
}
