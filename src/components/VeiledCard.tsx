interface VeiledCardProps {
  flipped?: boolean;
  loading?: boolean;
}

// 320 × 420 mystery card — used pre-reveal.
export function VeiledCard({ flipped = false, loading = false }: VeiledCardProps) {
  return (
    <div
      className="relative h-[420px] w-[320px] select-none rounded-3xl border border-[color:var(--border)] p-6 shadow-[var(--shadow-elev),var(--shadow-purple)] transition-transform duration-700"
      style={{
        background: "var(--gradient-card-back)",
        transform: flipped ? "rotateY(180deg)" : undefined,
      }}
    >
      {/* Decorative top row */}
      <div className="mb-6 flex justify-between text-[color:var(--accent)] opacity-70">
        {["✦", "·", "✦", "·", "✦", "·", "✦", "·", "✦"].map((s, i) => (
          <span key={i} className="text-xs">{s}</span>
        ))}
      </div>

      {/* Center frame */}
      <div className="flex h-[260px] items-center justify-center">
        <div
          className={`flex size-40 items-center justify-center rounded-2xl border-2 border-[color:var(--accent)]/40 bg-[color:var(--background)]/40 backdrop-blur-sm ${
            loading ? "animate-pulse-glow" : "animate-float"
          }`}
        >
          {loading ? (
            <span className="size-10 animate-spin-slow rounded-full border-4 border-[color:var(--amber)] border-t-transparent" />
          ) : (
            <span className="text-display text-7xl text-[color:var(--accent)]">?</span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-6 right-6 text-center">
        <p className="text-display text-xs uppercase tracking-[0.3em] text-[color:var(--muted-foreground)]">
          Friend Zone
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-widest text-[color:var(--muted-foreground)] opacity-60">
          Ritual · Chain 1979
        </p>
      </div>
    </div>
  );
}
