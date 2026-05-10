interface RevealedCardProps {
  username: string;
  avatarUrl?: string;
  quote: string;
}

const FALLBACK_COLORS = ["#7C3AED", "#F59E0B", "#10B981", "#3B82F6", "#EF4444"];

function colorFor(username: string): string {
  return FALLBACK_COLORS[username.charCodeAt(0) % FALLBACK_COLORS.length] ?? FALLBACK_COLORS[0];
}

export function RevealedCard({ username, avatarUrl, quote }: RevealedCardProps) {
  const shortQuote = quote.length > 120 ? `${quote.slice(0, 117)}...` : quote;
  const hasAvatar = Boolean(avatarUrl);

  return (
    <div
      id="friend-card"
      className="relative h-[440px] w-[320px] overflow-hidden rounded-3xl border border-[rgba(124,58,237,0.5)] p-6 animate-fade-in-up"
      style={{
        background: "radial-gradient(circle at 50% 30%, #1E1040 0%, #080818 100%)",
        boxShadow: "0 0 40px rgba(124,58,237,0.2)",
      }}
    >
      <div className="absolute left-4 top-4 h-3 w-3 border-l border-t border-[rgba(124,58,237,0.8)]" />
      <div className="absolute right-4 top-4 h-3 w-3 border-r border-t border-[rgba(124,58,237,0.8)]" />
      <div className="absolute bottom-4 left-4 h-3 w-3 border-b border-l border-[rgba(124,58,237,0.8)]" />
      <div className="absolute bottom-4 right-4 h-3 w-3 border-b border-r border-[rgba(124,58,237,0.8)]" />

      <div className="text-center text-[11px] uppercase tracking-[0.2em] text-[#A78BFA]">RITUAL [ Friend Zone ]</div>
      <div className="my-3 h-px bg-[rgba(124,58,237,0.35)]" />

      <div className="mb-4 mt-2 flex justify-center">
        <div
          className="grid h-[120px] w-[120px] place-items-center overflow-hidden rounded-full border-[3px] border-[#F59E0B]"
          style={{ boxShadow: "0 0 16px rgba(245,158,11,0.5)" }}
        >
          {hasAvatar ? (
            <img
              src={avatarUrl}
              alt={username}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div
              className="grid h-full w-full place-items-center text-4xl font-black uppercase text-white"
              style={{ backgroundColor: colorFor(username) }}
            >
              {username[0]}
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-[11px] text-[color:var(--muted-foreground)]">your ritual friend is</p>
      <h3 className="mt-2 text-center text-3xl font-black text-white">@{username}</h3>

      <div className="my-4 h-px bg-[rgba(124,58,237,0.25)]" />
      <p className="line-clamp-2 text-center text-xs italic text-[#A78BFA]" title={quote}>
        "{shortQuote}"
      </p>
      <div className="my-4 h-px bg-[rgba(124,58,237,0.25)]" />

      <p className="text-center text-[10px] text-[color:var(--muted-foreground)]">🤝 ritual.foundation</p>
    </div>
  );
}
