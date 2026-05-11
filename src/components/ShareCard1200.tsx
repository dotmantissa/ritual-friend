interface ShareCard1200Props {
  username: string;
  avatarUrl?: string;
  quote: string;
  onAvatarLoad?: () => void;
}

const FALLBACK_COLORS = ["#7C3AED", "#F59E0B", "#10B981", "#3B82F6", "#EF4444"];

function colorFor(username: string): string {
  return FALLBACK_COLORS[username.charCodeAt(0) % FALLBACK_COLORS.length] ?? FALLBACK_COLORS[0];
}

export function ShareCard1200({ username, avatarUrl, quote, onAvatarLoad }: ShareCard1200Props) {
  const safeQuote = quote.length > 340 ? `${quote.slice(0, 337)}...` : quote;

  return (
    <div
      id="share-card-1200"
      style={{
        width: "640px",
        height: "840px",
        borderRadius: "20px",
        background: "linear-gradient(160deg, #1E1B4B 0%, #0D0B2A 100%)",
        border: "1px solid rgba(245,158,11,0.5)",
        boxShadow: "0 0 40px rgba(245,158,11,0.2), 0 0 80px rgba(245,158,11,0.08)",
        textAlign: "center",
        padding: "32px 36px 28px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <p style={{ margin: 0, fontSize: "13px", letterSpacing: "6px", color: "#A78BFA" }}>RITUAL [ Friend Zone ]</p>
      <div style={{ width: "80%", margin: "8px auto 32px", borderTop: "1px solid rgba(124,58,237,0.3)" }} />

      <div
        style={{
          width: "220px",
          height: "220px",
          borderRadius: "50%",
          border: "3px solid #F59E0B",
          boxShadow: "0 0 16px rgba(245,158,11,0.5)",
          overflow: "hidden",
          margin: "0 auto 20px",
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username}
            referrerPolicy="no-referrer"
            onLoad={onAvatarLoad}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
            style={{ width: "220px", height: "220px", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "220px",
              height: "220px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "70px",
              fontWeight: 800,
              color: "#fff",
              textTransform: "uppercase",
              backgroundColor: colorFor(username),
            }}
          >
            {username[0]}
          </div>
        )}
      </div>

      <p style={{ margin: 0, fontSize: "16px", color: "#9CA3AF", letterSpacing: "2px" }}>your ritual friend is</p>
      <h3 style={{ margin: "8px 0 0", fontSize: "36px", fontWeight: 700, color: "#FFFFFF", wordBreak: "break-all" }}>@{username}</h3>

      <div style={{ width: "80%", margin: "20px auto 20px", borderTop: "1px dashed rgba(124,58,237,0.25)" }} />
      <p
        title={quote}
        style={{
          margin: 0,
          padding: "0 28px",
          fontSize: "18px",
          color: "#E2D9FF",
          lineHeight: "1.7",
          fontStyle: "italic",
          display: "-webkit-box",
          WebkitLineClamp: 4,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        "{safeQuote}"
      </p>

      <div style={{ marginTop: "auto", fontSize: "13px", color: "#6B7280", letterSpacing: "1px" }}>🤝 ritual.foundation</div>
    </div>
  );
}
