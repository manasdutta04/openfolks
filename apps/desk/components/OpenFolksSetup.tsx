import { useCallback, useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

interface OnboardingPayload {
  complete: boolean;
}

export function OpenFolksSetup({ onDone }: { onDone: () => void }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/openfolks/onboarding");
        if (!res.ok) throw new Error("Could not load onboarding state");
        const data = (await res.json()) as OnboardingPayload;
        if (data.complete) onDone();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load setup");
      } finally {
        setLoading(false);
      }
    })();
  }, [onDone]);

  const complete = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/openfolks/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "solo" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Setup failed");
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Setup failed");
    } finally {
      setBusy(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-canvas/95">
        <Loader2 className="size-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-canvas/95 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-3">
          <Sparkles className="size-6 text-accent" />
          <h1 className="text-xl font-semibold text-ink">Welcome to OpenFolks</h1>
        </div>
        <p className="mb-3 text-[14px] leading-relaxed text-ink-secondary">
          Meet <span className="font-medium text-ink">Assistant</span> — a vacant folk ready for whatever you need.
          Give it a computer, connect apps, or open <span className="font-medium text-ink">Marketplace</span> for team
          templates (Job Search and more).
        </p>
        <p className="mb-6 text-[13px] leading-relaxed text-ink-secondary">
          Your folks run on AI engines you already use. Bring your own keys and CLIs — nothing hosted in the middle.
          Approvals and finished work also show up on <span className="font-medium text-ink">Desk</span>.
        </p>
        {error && <p className="mb-3 text-[13px] text-danger">{error}</p>}
        <button
          type="button"
          disabled={busy}
          className="w-full rounded-xl bg-accent px-4 py-2.5 text-[14px] font-medium text-accent-fg disabled:opacity-50"
          onClick={() => void complete()}
        >
          {busy ? "Setting up…" : "Meet your first folk"}
        </button>
      </div>
    </div>
  );
}
