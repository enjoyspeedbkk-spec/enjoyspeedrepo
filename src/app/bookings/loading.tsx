export default function BookingsLoading() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-ink/5 mb-4">
          <div className="w-6 h-6 border-2 border-ink/20 border-t-accent rounded-full animate-spin" />
        </div>
        <p className="text-ink-muted text-sm font-medium">Loading your bookings…</p>
      </div>
    </div>
  );
}
