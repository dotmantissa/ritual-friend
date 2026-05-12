import { useEffect } from "react";
import { useSwitchChain, useAccount } from "wagmi";
import { ritualChain } from "@/lib/wagmi";

export function NetworkGuard({ children }: { children: React.ReactNode }) {
  const { isConnected, chain } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const isWrongChain = isConnected && !!chain && chain.id !== ritualChain.id;

  useEffect(() => {
    if (!isWrongChain) return;
    switchChain({ chainId: ritualChain.id });
  }, [isWrongChain, switchChain]);

  if (!isConnected || !isWrongChain) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--background)]/85 backdrop-blur-md">
        <div className="mx-4 max-w-md rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-8 text-center shadow-[var(--shadow-elev)]">
          <div className="mb-3 text-4xl">⚠</div>
          <h2 className="text-display mb-2 text-2xl">Wrong Network</h2>
          <p className="mb-6 text-sm text-[color:var(--muted-foreground)]">
            You're not on Ritual Chain. Switch to chain ID {ritualChain.id} to continue.
          </p>
          <button
            onClick={() => switchChain({ chainId: ritualChain.id })}
            disabled={isPending}
            className="w-full rounded-full bg-[color:var(--primary)] px-6 py-3 text-sm font-semibold uppercase tracking-wider text-[color:var(--primary-foreground)] transition hover:shadow-[var(--shadow-purple)] disabled:opacity-50"
          >
            {isPending ? "Switching…" : "Switch to Ritual Chain"}
          </button>
        </div>
      </div>
    </>
  );
}
