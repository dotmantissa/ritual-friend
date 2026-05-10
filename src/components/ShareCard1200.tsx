interface ShareCard1200Props {
  username: string;
  avatarUrl?: string;
  quote: string;
}

const FALLBACK_COLORS = ["#7C3AED", "#F59E0B", "#10B981", "#3B82F6", "#EF4444"];

function colorFor(username: string): string {
  return FALLBACK_COLORS[username.charCodeAt(0) % FALLBACK_COLORS.length] ?? FALLBACK_COLORS[0];
}

export function ShareCard1200({ username, avatarUrl, quote }: ShareCard1200Props) {
  const safeQuote = quote.length > 260 ? `${quote.slice(0, 257)}...` : quote;
  const fontSize = username.length > 12 ? 48 : 64;

  return (
    <div
      id="share-card-1200"
      style={{
        width: "1200px",
        height: "630px",
        position: "fixed",
        left: "-99999px",
        top: "0px",
        overflow: "hidden",
        background: "radial-gradient(ellipse at 20% 20%, #2D1B69 0%, #0D0D1A 55%, #1A0A2E 100%)",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "0px",
          backgroundImage:
            "linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: "-150px",
          top: "-140px",
          width: "500px",
          height: "500px",
          borderRadius: "500px",
          background: "radial-gradient(circle, #4C1D95 0%, transparent 70%)",
          opacity: 0.5,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "-120px",
          bottom: "-110px",
          width: "400px",
          height: "400px",
          borderRadius: "400px",
          background: "radial-gradient(circle, #78350F 0%, transparent 70%)",
          opacity: 0.4,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: "70px",
          top: "50px",
          width: "1060px",
          height: "530px",
          border: "1px solid rgba(124,58,237,0.35)",
          background: "rgba(10,10,22,0.42)",
          boxSizing: "border-box",
          padding: "28px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div style={{ fontSize: "16px", letterSpacing: "4px", color: "#A78BFA", fontFamily: "monospace" }}>
            RITUAL <span style={{ color: "#F59E0B" }}>[</span> Friend Zone <span style={{ color: "#F59E0B" }}>]</span>
          </div>
          <div style={{ fontSize: "12px", color: "#6B7280" }}>ritual.foundation</div>
        </div>

        <div style={{ borderTop: "1px solid rgba(124,58,237,0.25)", marginBottom: "28px" }} />

        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: "200px",
              height: "200px",
              borderRadius: "200px",
              overflow: "hidden",
              border: "4px solid #F59E0B",
              boxShadow: "0 0 30px rgba(245,158,11,0.5), 0 0 60px rgba(245,158,11,0.2)",
              display: "grid",
              placeItems: "center",
              marginRight: "44px",
              background: avatarUrl ? "transparent" : colorFor(username),
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={username} style={{ width: "200px", height: "200px", objectFit: "cover" }} />
            ) : (
              <span style={{ color: "white", fontSize: "84px", fontWeight: 800, textTransform: "uppercase" }}>
                {username[0]}
              </span>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ color: "#9CA3AF", fontSize: "16px", marginBottom: "8px" }}>your ritual friend is</div>
            <div style={{ color: "#FFFFFF", fontSize: `${fontSize}px`, fontWeight: 800, lineHeight: 1 }}>@{username}</div>
            <div style={{ borderTop: "1px solid rgba(124,58,237,0.25)", marginTop: "20px", marginBottom: "20px", width: "520px" }} />
            <div style={{ color: "#C4B5FD", fontSize: "18px", fontStyle: "italic", maxWidth: "480px", lineHeight: 1.5 }}>
              "{safeQuote}"
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(124,58,237,0.2)", marginTop: "30px", paddingTop: "12px", color: "#4B5563", fontSize: "13px" }}>
          Ritual Chain · Chain ID 1979 · Sign a tx. Make a friend.
        </div>
      </div>
    </div>
  );
}
