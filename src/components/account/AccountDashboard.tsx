"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { signOut, updateProfile } from "@/lib/actions/auth";
import { TIME_SLOTS } from "@/lib/constants";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  User,
  Calendar,
  ChevronRight,
  LogOut,
  Shield,
  Bike,
  Clock,
  Settings,
  ArrowRight,
  Pencil,
  Check,
  X,
  Phone,
  MessageCircle,
  Globe,
  Loader2,
} from "lucide-react";

interface AccountUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  lineId: string;
  preferredLanguage: string;
  avatarUrl: string;
  role: string;
  createdAt: string;
}

interface Booking {
  id: string;
  status: string;
  group_type: string;
  rider_count: number;
  ride_total: number;
  total_price: number;
  created_at: string;
  contact_name: string;
  ride_sessions: {
    date: string;
    time_slot_id: string;
  };
}

// Status badge variant map — labels resolved via t() at render time
const STATUS_VARIANT: Record<string, "success" | "warning" | "accent" | "default" | "sky"> = {
  pending: "warning",
  confirmed: "success",
  rider_details: "sky",
  ready: "accent",
  completed: "default",
  cancelled: "default",
  no_show: "default",
};

export function AccountDashboard({
  user,
  recentBookings,
}: {
  user: AccountUser;
  recentBookings: Booking[];
}) {
  const { t, locale } = useLanguage();
  const dateLocale = locale === "th" ? "th-TH" : "en-US";
  const [signingOut, setSigningOut] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: user.fullName || "",
    phone: user.phone || "",
    lineId: user.lineId || "",
    preferredLanguage: user.preferredLanguage || "en",
  });

  const upcomingBookings = recentBookings.filter(
    (b) => !["completed", "cancelled", "no_show"].includes(b.status)
  );
  const pastBookings = recentBookings.filter((b) =>
    ["completed", "cancelled", "no_show"].includes(b.status)
  );

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const result = await updateProfile(profileForm);
    setSaving(false);
    if (result.success) {
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setProfileForm({
      fullName: user.fullName || "",
      phone: user.phone || "",
      lineId: user.lineId || "",
      preferredLanguage: user.preferredLanguage || "en",
    });
  };

  const initials = user.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase();

  return (
    <section className="min-h-screen pt-24 pb-16 bg-cream">
      <div className="mx-auto max-w-2xl px-6">
        {/* Profile header */}
        <div className="flex items-center gap-4 mb-8">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              className="w-16 h-16 rounded-2xl object-cover shadow-sm"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
              <span className="text-xl font-bold text-accent">{initials}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">
              {user.fullName || "Rider"}
            </h1>
            <p className="text-sm text-ink-muted truncate">{user.email}</p>
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-accent hover:text-accent-dark transition-colors"
              >
                <Shield className="h-3 w-3" />
                Admin Dashboard
                <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className={`p-2.5 rounded-xl transition-all ${signingOut ? "opacity-50 cursor-not-allowed" : "text-ink-muted hover:text-ink hover:bg-sand/30"}`}
            title="Sign out"
          >
            {signingOut ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link href="/booking">
            <Card hover padding="md" className="h-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Bike className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{t("account.bookARide")}</p>
                  <p className="text-xs text-ink-muted">{t("account.bookARideDesc")}</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/bookings">
            <Card hover padding="md" className="h-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 text-sky" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{t("account.recentBookings")}</p>
                  <p className="text-xs text-ink-muted">
                    {upcomingBookings.length > 0
                      ? t("account.upcomingCount", { count: upcomingBookings.length })
                      : t("account.viewAllBookings")}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Upcoming bookings */}
        {upcomingBookings.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">{t("account.upcomingRides")}</h2>
              <Link
                href="/bookings"
                className="text-xs font-medium text-accent hover:text-accent-dark flex items-center gap-0.5 transition-colors"
              >
                {t("account.viewAllBookings")} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {upcomingBookings.map((booking) => {
                const session = booking.ride_sessions;
                const slot = TIME_SLOTS.find(
                  (s) => s.id === session.time_slot_id
                );
                const statusVariant =
                  STATUS_VARIANT[booking.status] ?? STATUS_VARIANT.pending;
                const statusKey = "account.status" + booking.status.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase()).replace(/^[a-z]/, (c: string) => c.toUpperCase());
                const rideDate = new Date(session.date + "T12:00");

                return (
                  <Link key={booking.id} href="/bookings">
                    <Card hover padding="sm" className="group">
                      <div className="flex items-center gap-3 p-2">
                        {/* Date badge */}
                        <div className="w-14 h-14 rounded-xl bg-accent/5 flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-ink-muted uppercase">
                            {rideDate.toLocaleDateString(dateLocale, {
                              month: "short",
                            })}
                          </span>
                          <span className="text-xl font-bold text-ink leading-none">
                            {rideDate.getDate()}
                          </span>
                          <span className="text-xs text-ink-muted">
                            {rideDate.toLocaleDateString(dateLocale, {
                              weekday: "short",
                            })}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">
                              {slot?.label || session.time_slot_id}
                            </span>
                            <Badge variant={statusVariant}>
                              {t(statusKey)}
                            </Badge>
                          </div>
                          <p className="text-xs text-ink-muted mt-0.5">
                            <Clock className="inline h-3 w-3 mr-1" />
                            {slot
                              ? `${slot.startTime}–${slot.endTime}`
                              : session.time_slot_id}{" "}
                            · {booking.group_type} ·{" "}
                            {booking.rider_count === 1
                              ? `1 ${t("account.rider")}`
                              : `${booking.rider_count} ${t("account.riders")}`}
                          </p>
                        </div>

                        <ChevronRight className="h-4 w-4 text-ink-muted group-hover:text-ink transition-colors flex-shrink-0" />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* No upcoming bookings */}
        {upcomingBookings.length === 0 && (
          <Card padding="lg" className="mb-8 text-center">
            <Bike className="h-8 w-8 text-ink-muted/30 mx-auto mb-3" />
            <p className="font-semibold text-sm">{t("account.noBookings")}</p>
            <p className="text-xs text-ink-muted mt-1 mb-4">
              {t("account.startBooking")}
            </p>
            <Link href="/booking">
              <Button variant="secondary" size="sm" arrow>
                {t("account.bookARide")}
              </Button>
            </Link>
          </Card>
        )}

        {/* Past bookings preview */}
        {pastBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-3">{t("account.pastRides")}</h2>
            <div className="space-y-2">
              {pastBookings.slice(0, 3).map((booking) => {
                const session = booking.ride_sessions;
                const slot = TIME_SLOTS.find(
                  (s) => s.id === session.time_slot_id
                );
                const rideDate = new Date(session.date + "T12:00");

                return (
                  <Link key={booking.id} href="/bookings">
                    <Card hover padding="sm" className="group opacity-75 hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-3 p-2">
                        <div className="w-10 h-10 rounded-lg bg-sand/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-ink-muted">
                            {rideDate.getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">
                            {slot?.label || session.time_slot_id}
                          </span>
                          <p className="text-xs text-ink-muted">
                            {rideDate.toLocaleDateString(dateLocale, {
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            · {booking.group_type} ·{" "}
                            {booking.total_price?.toLocaleString()} THB
                          </p>
                        </div>
                        <Badge variant="default">
                          {t("account.status" + booking.status.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase()).replace(/^[a-z]/, (c: string) => c.toUpperCase()))}
                        </Badge>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Account info — editable */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-ink-muted" />
              <h2 className="text-sm font-bold">{t("account.profile")}</h2>
            </div>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-dark transition-colors"
              >
                <Pencil className="h-3 w-3" />
                {t("account.editProfile")}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink transition-colors"
                >
                  <X className="h-3 w-3" />
                  {t("account.discardChanges")}
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-1 text-xs font-semibold text-white bg-accent hover:bg-accent-dark px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {t("account.saveChanges")}…
                    </>
                  ) : (
                    <>
                      <Check className="h-3 w-3" />
                      {t("account.saveChanges")}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {saved && (
            <div className="mb-4 p-2.5 rounded-lg bg-success/10 border border-success/20 text-sm text-success font-medium text-center">
              {t("account.changesSaved")}
            </div>
          )}

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">
                  <User className="inline h-3 w-3 mr-1" />
                  {t("account.fullName")}
                </label>
                <input
                  type="text"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm((f) => ({ ...f, fullName: e.target.value }))}
                  placeholder="Your full name"
                  className="w-full px-3 py-2.5 rounded-xl border border-sand bg-surface text-sm font-medium focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">
                  <Phone className="inline h-3 w-3 mr-1" />
                  {t("account.phone")}
                </label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                    const formatted = digits.length > 3
                      ? digits.length > 6
                        ? `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
                        : `${digits.slice(0, 3)}-${digits.slice(3)}`
                      : digits;
                    setProfileForm((f) => ({ ...f, phone: formatted }));
                  }}
                  placeholder="08X-XXX-XXXX"
                  className="w-full px-3 py-2.5 rounded-xl border border-sand bg-surface text-sm font-medium focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
                />
                {profileForm.phone && profileForm.phone.replace(/\D/g, "").length > 0 && profileForm.phone.replace(/\D/g, "").length < 10 && (
                  <p className="mt-1 text-xs text-ink-muted">10-digit Thai mobile number</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">
                  <MessageCircle className="inline h-3 w-3 mr-1" />
                  {t("account.lineId")}
                </label>
                <input
                  type="text"
                  value={profileForm.lineId}
                  onChange={(e) => setProfileForm((f) => ({ ...f, lineId: e.target.value }))}
                  placeholder="Your LINE ID (optional)"
                  className="w-full px-3 py-2.5 rounded-xl border border-sand bg-surface text-sm font-medium focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">
                  <Globe className="inline h-3 w-3 mr-1" />
                  {t("account.preferredLanguage")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "en", label: t("account.english") },
                    { value: "th", label: t("account.thai") },
                  ].map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => setProfileForm((f) => ({ ...f, preferredLanguage: lang.value }))}
                      className={`p-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        profileForm.preferredLanguage === lang.value
                          ? "border-accent bg-accent/5 text-accent"
                          : "border-sand bg-surface text-ink-muted hover:border-ink/20"
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t border-sand/50">
                <div className="flex justify-between text-sm">
                  <span className="text-ink-muted">Email</span>
                  <span className="font-medium text-ink-muted">{user.email}</span>
                </div>
                <p className="text-xs text-ink-muted/60 mt-1">
                  Email is managed through your sign-in provider
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-muted">{t("account.fullName")}</span>
                <span className="font-medium">{user.fullName || t("account.notSet")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Email</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">{t("account.phone")}</span>
                <span className="font-medium">{user.phone || t("account.notSet")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">{t("account.lineId")}</span>
                <span className="font-medium">{user.lineId || t("account.notSet")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Language</span>
                <span className="font-medium">{user.preferredLanguage === "th" ? t("account.thai") : t("account.english")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">{t("account.createdAt").split("{date}")[0]}</span>
                <span className="font-medium">
                  {new Date(user.createdAt).toLocaleDateString(dateLocale, {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* Sign out */}
        <div className="mt-6 text-center">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="text-sm text-ink-muted hover:text-ink font-medium transition-colors"
          >
            {signingOut ? `${t("account.signOut")}...` : t("account.signOut")}
          </button>
        </div>
      </div>
    </section>
  );
}
