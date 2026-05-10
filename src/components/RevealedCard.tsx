interface RevealedCardProps {
  username: string;
  avatarUrl: string;
  index: number;
  total: number;
}

export function RevealedCard({ username, avatarUrl, index, total }: RevealedCardProps) {
  return (
    <div
      className="relative h-[420px] w-[320px] overflow-hidden rounded-3xl border-2 border-[color:var(--amber)]/60 p-6 animate-amber-pulse animate-fade-in-up"
      style={{ background: "var(--gradient-primary)" }}
    >
      {/* Glow corners */}
      <div className="pointer-events-none absolute -top-12 -right-12 size-40 rounded-full bg-[color:var(--amber)] opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 size-40 rounded-full bg-[color:var(--accent)] opacity-30 blur-3xl" />

      {/* Top label */}
      <div className="relative z-10 mb-6 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-[color:var(--foreground)]/80">
        <span>Your Friend</span>
        <span>#{String(index).padStart(3, "0")}</span>
      </div>

      {/* Avatar */}
      <div className="relative z-10 mx-auto mb-5 size-32 overflow-hidden rounded-full border-4 border-[color:var(--amber)] shadow-[var(--shadow-amber)]">
        <img
          src={avatarUrl}
          alt={username}
          className="size-full object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "https://cdn.discordapp.com/embed/avatars/0.png";
          }}
        />
      </div>

      {/* Name */}
      <div className="relative z-10 text-center">
        <h3 className="text-display shimmer-text break-words text-3xl leading-tight">
          {username}
        </h3>
        <p className="mt-2 text-xs uppercase tracking-widest text-[color:var(--foreground)]/70">
          A new ritual friend
        </p>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-6 right-6 z-10 flex items-center justify-between text-[10px] uppercase tracking-widest text-[color:var(--foreground)]/70">
        <span>Pool size {total}</span>
        <span>Ritual · 1979</span>
      </div>
    </div>
  );
}
