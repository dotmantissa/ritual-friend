import { useAccount } from "wagmi";

interface DiscordConnectProps {
  onSkip: () => void;
}

export function DiscordConnect({ onSkip }: DiscordConnectProps) {
  const { address } = useAccount();

  const handleConnect = () => {
    const wallet = address ?? "anon";
    // Server route handles full OAuth redirect chain.
    window.location.href = `/api/auth/discord?wallet=${wallet}&returnTo=/`;
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-8 text-center shadow-[var(--shadow-elev)] animate-fade-in-up">
      <div className="mb-4 text-5xl">👾</div>
      <h2 className="text-display mb-2 text-2xl">One more step</h2>
      <p className="mb-6 text-sm text-[color:var(--muted-foreground)]">
        Connect your Discord to join the friend pool. Others will be able to find <em>you</em> too.
      </p>
      <button
        onClick={handleConnect}
        className="w-full rounded-full bg-[#5865F2] px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:opacity-90 hover:shadow-[0_0_30px_rgba(88,101,242,0.5)]"
      >
        Connect Discord
      </button>
      <button
        onClick={onSkip}
        className="mt-3 text-xs text-[color:var(--muted-foreground)] underline-offset-2 hover:underline"
      >
        Skip for now
      </button>
      <div className="mt-6 border-t border-[color:var(--border)] pt-4 text-xs text-[color:var(--muted-foreground)]">
        You must be in the Ritual server.{" "}
        <a
          href="https://discord.gg/ritual"
          target="_blank"
          rel="noreferrer"
          className="text-[color:var(--accent)] hover:underline"
        >
          Join here
        </a>
      </div>
    </div>
  );
}
