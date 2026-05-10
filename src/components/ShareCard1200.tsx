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
  const safeQuote = quote.length > 260 ? `${quote.slice(0, 257)}...` : quote;
  const fontSize = username.length > 12 ? 48 : 64;

  return (
    <div
      id="share-card-1200"
      style={{
        width: "1200px",
        height: "630px",
        overflow: "hidden",
        background: "radial-gradient(ellipse at 20% 20%, #2D1B69 0%, #0D0D1A 55%, #1A0A2E 100%)",
        border: "1px solid rgba(124,58,237,0.35)",
        boxSizing: "border-box",
        fontFamily: "Inter, sans-serif",
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
          left: "-100px",
          top: "-100px",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(76,29,149,0.5) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          right: "-80px",
          bottom: "-80px",
          width: "420px",
          height: "420px",
          background: "radial-gradient(circle, rgba(120,53,15,0.4) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "absolute", left: "60px", top: "48px", right: "60px", bottom: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "15px", letterSpacing: "4px", color: "#A78BFA", fontFamily: "monospace" }}>
            RITUAL <span style={{ color: "#F59E0B" }}>[</span> Friend Zone <span style={{ color: "#F59E0B" }}>]</span>
          </div>
          <div style={{ fontSize: "11px", color: "#6B7280", letterSpacing: "2px" }}>ritual.foundation</div>
        </div>

        <div style={{ borderTop: "1px solid rgba(124,58,237,0.25)", marginTop: "20px", marginBottom: "30px" }} />

        <div style={{ display: "flex", alignItems: "center", gap: "60px" }}>
          <div
            style={{
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              border: "4px solid #F59E0B",
              boxShadow: "0 0 30px rgba(245,158,11,0.5), 0 0 60px rgba(245,158,11,0.2)",
              overflow: "hidden",
              display: "grid",
              placeItems: "center",
              background: avatarUrl ? "transparent" : colorFor(username),
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={username} style={{ width: "200px", height: "200px", objectFit: "cover" }} onLoad={onAvatarLoad} />
            ) : (
              <span style={{ color: "#FFFFFF", fontSize: "80px", fontWeight: 800, textTransform: "uppercase" }}>{username[0]}</span>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "16px", color: "#9CA3AF", fontWeight: 400, marginBottom: "12px" }}>your ritual friend is</div>
            <div style={{ fontSize: `${fontSize}px`, color: "#FFFFFF", fontWeight: 800, lineHeight: "1" }}>@{username}</div>
            <div style={{ borderTop: "1px solid rgba(124,58,237,0.2)", marginTop: "24px", width: "100%" }} />
            <div
              style={{
                marginTop: "24px",
                fontSize: "18px",
                color: "#C4B5FD",
                fontStyle: "italic",
                lineHeight: "1.6",
                maxWidth: "480px",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              "{safeQuote}"
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "0px",
            left: "0px",
            right: "0px",
            borderTop: "1px solid rgba(124,58,237,0.2)",
            paddingTop: "16px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: "13px", color: "#4B5563" }}>Ritual Chain · Chain ID 1979 · Sign a tx. Make a friend.</div>
          <div style={{ fontSize: "13px", color: "#6B7280" }}>@ritualnet</div>
        </div>
      </div>
    </div>
  );
}
