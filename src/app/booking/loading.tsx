export default function BookingLoading() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/10 mb-4">
          <div className="w-7 h-7 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
        <p className="text-ink-muted text-sm font-medium">Preparing your booking…</p>
      </div>
    </div>
  );
}
