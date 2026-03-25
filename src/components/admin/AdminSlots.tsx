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
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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

export function AdminSlots({
  initialSessions,
  initialBookings,
  initialBlackouts,
}: {
  initialSessions: Session[];
  initialBookings: SessionBooking[];
  initialBlackouts: BlackoutDate[];
}) {
  const [sessions, setSessions] = useState(initialSessions);
  const [bookings] = useState(initialBookings);
  const [blackouts, setBlackouts] = useState(initialBlackouts);
  const [weekOffset, setWeekOffset] = useState(0);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showBlackoutForm, setShowBlackoutForm] = useState(false);
  const [blackoutDate, setBlackoutDate] = useState("");
  const [blackoutReason, setBlackoutReason] = useState("");
  const [blackoutSlots, setBlackoutSlots] = useState<string[]>([]);

  // Build date range for current week view
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() + weekOffset * 7);
  // Set to Monday
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
    }
    setUpdating(null);
  };

  const handleRemoveBlackout = async (id: string) => {
    setUpdating(id);
    const result = await deleteBlackoutDate(id);
    if (result.success) {
      setBlackouts((prev) => prev.filter((b) => b.id !== id));
    }
    setUpdating(null);
  };

  const weatherIcons: Record<string, typeof Sun> = {
    clear: Sun,
    warning: CloudRain,
    cancelled: XCircle,
  };

  const isToday = (d: Date) => formatDateKey(d) === formatDateKey(today);
  const isPast = (d: Date) => formatDateKey(d) < formatDateKey(today);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Slots & Availability</h1>
          <p className="text-sm text-ink-muted mt-1">
            Manage daily slots, weather, and blackout dates
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
        <Card padding="md">
          <p className="font-semibold text-sm mb-3">Add Blackout Date</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-ink-muted mb-1 block">Date</label>
              <input
                type="date"
                value={blackoutDate}
                onChange={(e) => setBlackoutDate(e.target.value)}
                min={formatDateKey(today)}
                className="w-full px-3 py-2 rounded-lg border-2 border-sand/60 text-sm focus:border-ink focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-ink-muted mb-1 block">Reason</label>
              <input
                type="text"
                value={blackoutReason}
                onChange={(e) => setBlackoutReason(e.target.value)}
                placeholder="e.g. Holiday, Private event..."
                className="w-full px-3 py-2 rounded-lg border-2 border-sand/60 text-sm focus:border-ink focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-ink-muted mb-1 block">
                Affected Slots (leave empty for all)
              </label>
              <div className="flex gap-1.5 flex-wrap">
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
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                      blackoutSlots.includes(s.id)
                        ? "bg-ink text-cream"
                        : "bg-sand/30 text-ink-muted"
                    }`}
                  >
                    {s.id}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleAddBlackout}
              disabled={!blackoutDate || !blackoutReason || updating === "blackout"}
            >
              {updating === "blackout" ? "Adding..." : "Add Blackout"}
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
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          className="p-2 rounded-lg hover:bg-sand/30 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-center">
          <p className="font-semibold text-sm">
            {days[0].toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            –{" "}
            {days[6].toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs text-sky hover:text-sky-dark"
            >
              Back to this week
            </button>
          )}
        </div>
        <button
          onClick={() => setWeekOffset((w) => w + 1)}
          className="p-2 rounded-lg hover:bg-sand/30 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="space-y-2">
        {days.map((day) => {
          const dateKey = formatDateKey(day);
          const daySessions = sessionsByDate.get(dateKey) || [];
          const dayBlackouts = blackoutsByDate.get(dateKey) || [];
          const past = isPast(day);
          const todayHighlight = isToday(day);

          return (
            <Card
              key={dateKey}
              padding="sm"
              className={`${
                todayHighlight
                  ? "ring-2 ring-accent/30 bg-accent/5"
                  : past
                  ? "opacity-50"
                  : ""
              }`}
            >
              <div className="flex items-start gap-3 p-2">
                {/* Date column */}
                <div className="w-14 flex-shrink-0 text-center">
                  <p className="text-[10px] uppercase text-ink-muted font-semibold">
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </p>
                  <p
                    className={`text-xl font-bold ${
                      todayHighlight ? "text-accent" : ""
                    }`}
                  >
                    {day.getDate()}
                  </p>
                  <p className="text-[10px] text-ink-muted">
                    {day.toLocaleDateString("en-US", { month: "short" })}
                  </p>
                </div>

                {/* Slots */}
                <div className="flex-1 min-w-0">
                  {/* Blackout warnings */}
                  {dayBlackouts.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-2 mb-2 rounded-lg bg-warning/10 border border-warning/20 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Ban className="h-3.5 w-3.5 text-warning" />
                        <span className="font-medium text-warning">
                          Blackout: {b.reason}
                        </span>
                        {b.affects_slots?.length > 0 && (
                          <span className="text-ink-muted">
                            (Slots: {b.affects_slots.join(", ")})
                          </span>
                        )}
                      </div>
                      {!past && (
                        <button
                          onClick={() => handleRemoveBlackout(b.id)}
                          disabled={updating === b.id}
                          className="text-ink-muted hover:text-warning transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-ink-muted"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Slot rows */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {TIME_SLOTS.map((slot) => {
                      const session = daySessions.find(
                        (s) => s.time_slot_id === slot.id
                      );
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
                      const WeatherIcon =
                        session?.weather_status
                          ? weatherIcons[session.weather_status] || Sun
                          : Sun;
                      const hasBookings = sessionBookings.length > 0;

                      return (
                        <div
                          key={slot.id}
                          className={`p-2.5 rounded-lg border text-xs transition-all ${
                            isBlackedOut
                              ? "bg-warning/5 border-warning/20 opacity-60"
                              : session && !session.is_available
                              ? "bg-sand/20 border-sand/40 opacity-60"
                              : hasBookings
                              ? "bg-sky/5 border-sky/20"
                              : "bg-surface border-sand/40"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs">
                                {slot.id}
                              </span>
                              <span className="text-ink-muted text-xs">
                                {slot.startTime}–{slot.endTime}
                              </span>
                            </div>
                            {session && !past && (
                              <button
                                onClick={() =>
                                  handleWeatherUpdate(
                                    session.id,
                                    (!session.weather_status || session.weather_status === "clear")
                                      ? "warning"
                                      : session.weather_status === "warning"
                                      ? "cancelled"
                                      : "clear"
                                  )
                                }
                                disabled={updating === session.id}
                                className="p-1 rounded hover:bg-sand/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                title={`Weather: ${
                                  session.weather_status || "clear"
                                }`}
                              >
                                <WeatherIcon
                                  className={`h-3 w-3 ${
                                    session.weather_status === "warning"
                                      ? "text-warning"
                                      : session.weather_status === "cancelled"
                                      ? "text-red-500"
                                      : "text-success"
                                  }`}
                                />
                              </button>
                            )}
                          </div>

                          {/* Bookings under this slot */}
                          {hasBookings ? (
                            <div className="space-y-1">
                              {sessionBookings.map((b, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between"
                                >
                                  <span className="truncate">
                                    {b.contact_name}
                                  </span>
                                  <div className="flex items-center gap-1 text-ink-muted">
                                    <Users className="h-2.5 w-2.5" />
                                    {b.rider_count}
                                  </div>
                                </div>
                              ))}
                              <p className="text-ink-muted text-[10px] mt-1">
                                {totalRiders} total riders
                              </p>
                            </div>
                          ) : (
                            <p className="text-ink-muted/50 text-[10px]">
                              {isBlackedOut
                                ? "Blacked out"
                                : session && !session.is_available
                                ? "Disabled"
                                : "No bookings"}
                            </p>
                          )}

                          {/* Toggle availability */}
                          {session && !past && !isBlackedOut && (
                            <button
                              onClick={() =>
                                handleToggleAvailability(
                                  session.id,
                                  session.is_available
                                )
                              }
                              disabled={updating === session.id}
                              className={`mt-2 w-full py-1 rounded text-[10px] font-semibold transition-all ${
                                session.is_available
                                  ? "bg-sand/30 text-ink-muted hover:bg-sand/50"
                                  : "bg-success/10 text-success hover:bg-success/20"
                              }`}
                            >
                              {session.is_available ? "Disable" : "Enable"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Active blackouts summary */}
      {blackouts.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-ink-muted mb-2">
            Active Blackout Dates
          </p>
          <div className="space-y-1.5">
            {blackouts
              .filter((b) => b.date >= formatDateKey(today))
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-sand/40 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Ban className="h-3.5 w-3.5 text-warning" />
                    <span className="font-medium">
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
                    onClick={() => handleRemoveBlackout(b.id)}
                    disabled={updating === b.id}
                    className="text-ink-muted hover:text-warning transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-ink-muted"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
