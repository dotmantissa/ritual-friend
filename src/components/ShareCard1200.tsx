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
        borderRadius: "20px",
        background: "linear-gradient(160deg, #1E1B4B 0%, #0D0B2A 100%)",
        border: "1px solid rgba(245,158,11,0.5)",
        boxShadow: "0 0 40px rgba(245,158,11,0.2), 0 0 80px rgba(245,158,11,0.08)",
        textAlign: "center",
        padding: "24px 20px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <p style={{ margin: 0, fontSize: "13px", letterSpacing: "6px", color: "#A78BFA" }}>RITUAL [ Friend Zone ]</p>
        <div style={{ width: "80%", margin: 0, borderTop: "1px solid rgba(124,58,237,0.3)" }} />

        <div
          style={{
            width: "280px",
            height: "280px",
            borderRadius: "50%",
            border: "3px solid #F59E0B",
            boxShadow: "0 0 16px rgba(245,158,11,0.5)",
            overflow: "hidden",
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
              style={{ width: "280px", height: "280px", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "280px",
                height: "280px",
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
      </div>

      <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
        <p style={{ margin: 0, fontSize: "16px", color: "#9CA3AF", letterSpacing: "2px" }}>your ritual friend is</p>
        <h3 style={{ margin: 0, fontSize: "44px", fontWeight: 700, color: "#FFFFFF", wordBreak: "break-all" }}>@{username}</h3>
        <div style={{ width: "80%", margin: 0, borderTop: "1px dashed rgba(124,58,237,0.25)" }} />
        <p
          title={quote}
          style={{
            margin: 0,
            padding: "0 16px",
            textAlign: "center",
            fontSize: "22px",
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
      </div>

      <div style={{ margin: 0, fontSize: "13px", color: "#6B7280", letterSpacing: "1px" }}>🤝 ritual.foundation</div>
    </div>
  );
}
