import { useAccount, useConnect, useDisconnect } from "wagmi";

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletConnect() {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="group flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-raised)] px-4 py-2 text-sm font-medium">
        <span className="size-2 rounded-full bg-[color:var(--success)] shadow-[0_0_8px_var(--success)]" />
        <span className="font-mono">{truncate(address)}</span>
        <button
          onClick={() => disconnect()}
          className="ml-1 text-xs text-[color:var(--muted-foreground)] opacity-0 transition group-hover:opacity-100 hover:text-[color:var(--foreground)]"
          aria-label="Disconnect wallet"
        >
          ✕
        </button>
      </div>
    );
  }

  if (isConnecting || isPending) {
    return (
      <button
        disabled
        className="flex items-center gap-2 rounded-full border-2 border-[color:var(--primary)] px-6 py-3 text-sm font-semibold uppercase tracking-wider"
      >
        <span className="size-3 animate-spin-slow rounded-full border-2 border-[color:var(--primary)] border-t-transparent" />
        Connecting…
      </button>
    );
  }

  const connector = connectors[0];
  return (
    <button
      onClick={() => connector && connect({ connector })}
      className="rounded-full border-2 border-[color:var(--primary)] bg-[color:var(--surface)]/40 px-6 py-3 text-sm font-semibold uppercase tracking-wider transition hover:bg-[color:var(--primary)] hover:text-[color:var(--primary-foreground)] hover:shadow-[var(--shadow-purple)]"
    >
      Connect Wallet
    </button>
  );
}
