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

  return (
    <div className="friend-revealed-card">
      <p className="revealed-title">RITUAL [ Friend Zone ]</p>
      <div className="revealed-divider" />

      <div className="revealed-avatar-wrap">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username}
            className="revealed-avatar"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="revealed-avatar-fallback" style={{ backgroundColor: colorFor(username) }}>
            {username[0]}
          </div>
        )}
      </div>

      <p className="revealed-sub">your ritual friend is</p>
      <h3 className="revealed-username">@{username}</h3>

      <div className="revealed-divider dashed" />
      <p className="revealed-quote" title={quote}>
        "{shortQuote}"
      </p>

      <div className="revealed-footer">🤝 ritual.foundation</div>
    </div>
  );
}
