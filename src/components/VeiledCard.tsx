interface VeiledCardProps {
  state?: "idle" | "wallet_needed" | "ready" | "pending_tx" | "mining" | "revealed" | "error";
}

export function VeiledCard({ state = "idle" }: VeiledCardProps) {
  const pending = state === "pending_tx";
  const mining = state === "mining";

  const border = pending
    ? "1px solid rgba(167, 139, 250, 0.8)"
    : mining
      ? "1px solid rgba(245, 158, 11, 0.8)"
      : "1px solid rgba(167, 139, 250, 0.4)";

  const boxShadow = pending
    ? "0 0 50px rgba(124,58,237,0.45), 0 0 90px rgba(124,58,237,0.2)"
    : mining
      ? "0 0 50px rgba(245,158,11,0.35), 0 0 80px rgba(124,58,237,0.2)"
      : "0 0 40px rgba(124,58,237,0.25), 0 0 80px rgba(124,58,237,0.1)";

  return (
    <div
      className={`friend-veiled-card ${pending ? "is-pending" : ""} ${mining ? "is-mining" : ""}`}
      style={{
        border,
        boxShadow,
      }}
    >
      <div className="veiled-top">+ · + · + · +</div>
      <div className="veiled-center-wrap">
        <div className="veiled-center-box">
          <span className="veiled-question">?</span>
        </div>
      </div>
      <div className="veiled-bottom">
        <p>FRIEND ZONE</p>
        <p>RITUAL · CHAIN 1979</p>
      </div>
    </div>
  );
}
