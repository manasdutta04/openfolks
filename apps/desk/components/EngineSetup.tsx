// A focused setup card shared by onboarding, the model picker, and runtime
// errors. The command has one inline copy action and one primary next step;
// unusable model lists stay out of the way until the engine is ready.
import { useEffect, useState } from "react";
import { Check, Copy, Download, ExternalLink, KeyRound, Loader2, LogIn, Settings2, TerminalSquare } from "lucide-react";
import { api, useStore, type AppSettingsSection, type ConfigStatus, type EngineInstall, type InstanceInfo } from "@/state/store";
import { cn } from "@/lib/cn";

const OPENROUTER_DEFAULT_URL = "https://openrouter.ai/api/v1";

export function OpenRouterSetup({
  instance,
  className,
}: {
  instance: InstanceInfo;
  className?: string;
}) {
  const { state, dispatch, refreshInstances } = useStore();
  const configured = Boolean(state.config?.openaiCompat?.configured);
  const savedUrl = state.config?.openaiCompat?.url?.trim() || OPENROUTER_DEFAULT_URL;
  const [key, setKey] = useState("");
  const [url, setUrl] = useState(savedUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUrl(savedUrl);
  }, [savedUrl]);

  const keyDirty = Boolean(key.trim());
  const urlDirty = url.trim().replace(/\/+$/, "") !== savedUrl.replace(/\/+$/, "");
  const clearing = configured && !keyDirty && !urlDirty;
  const canSubmit = !saving && (keyDirty || urlDirty || configured);

  const save = () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    const nextKey = key.trim();
    const nextUrl = url.trim() || OPENROUTER_DEFAULT_URL;
    const persistKey = nextKey || (clearing ? "" : undefined);
    const request =
      persistKey !== undefined && window.ogb?.setCredential
        ? window.ogb
            .setCredential("openaiCompatApiKey", persistKey)
            .then(() =>
              api("/api/config", {
                method: "PUT",
                body: JSON.stringify({ openaiCompat: { url: nextUrl } }),
              }),
            )
        : api("/api/config", {
            method: "PUT",
            body: JSON.stringify({
              openaiCompat: {
                ...(persistKey !== undefined ? { key: persistKey } : {}),
                url: nextUrl,
              },
            }),
          });
    request
      .then((status: ConfigStatus) => {
        dispatch({ type: "configStatus", config: status });
        setKey("");
        return refreshInstances();
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setSaving(false));
  };

  return (
    <div className={cn("rounded-xl border border-hairline/40 bg-control/30 p-3", className)}>
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-inset text-ink-secondary">
          <KeyRound size={14} />
        </span>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-ink">
            {configured ? `Update ${instance.displayName}` : `Connect ${instance.displayName}`}
          </div>
          <p className="mt-0.5 text-[12px] leading-relaxed text-ink-secondary">
            Paste an OpenRouter, Groq, or any OpenAI-compatible API key. Models load from the endpoint you set.
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder={configured ? "••••••••  (paste to replace)" : "sk-or-…, gsk_…, or any provider key"}
          aria-label={`${instance.displayName} API key`}
          autoComplete="off"
          className="w-full rounded-lg border border-hairline/40 bg-inset px-3 py-2 text-[13px] text-ink placeholder:text-ink-secondary focus:border-hairline focus:outline-none"
        />
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder={OPENROUTER_DEFAULT_URL}
          aria-label={`${instance.displayName} API URL`}
          spellCheck={false}
          className="w-full rounded-lg border border-hairline/40 bg-inset px-3 py-2 font-mono text-[12px] text-ink placeholder:font-sans placeholder:text-ink-secondary focus:border-hairline focus:outline-none"
        />
        <button
          type="button"
          onClick={save}
          disabled={!canSubmit}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-semibold",
            clearing
              ? "bg-control text-danger hover:bg-raised-hover"
              : "bg-accent text-white hover:brightness-110",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : clearing ? "Clear key" : configured ? "Save" : "Connect"}
        </button>
        {error && <div className="text-[12px] text-danger">{error}</div>}
      </div>
      <a
        href="https://openrouter.ai/keys"
        target="_blank"
        rel="noreferrer"
        className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] font-medium text-accent hover:underline"
      >
        <ExternalLink size={12} /> Get an OpenRouter key
      </a>
    </div>
  );
}

type Platform = "darwin" | "win32" | "linux";

function hostPlatform(): Platform {
  const platform = window.ogb?.platform;
  if (platform === "darwin" || platform === "win32" || platform === "linux") return platform;
  const userAgent = navigator.userAgent;
  if (userAgent.includes("Mac")) return "darwin";
  if (userAgent.includes("Win")) return "win32";
  return "linux";
}

/** The install command for this machine, or null when the engine has none
 * here (a GUI download, or a POSIX-only installer viewed on Windows). */
export function installCommandFor(install: EngineInstall | undefined): string | null {
  return install?.command?.[hostPlatform()] ?? null;
}

/** Installed but missing the cloud account session. */
export function needsSignIn(instance: InstanceInfo | undefined): boolean {
  return instance?.snapshot.state === "available" && instance.snapshot.authenticated === false;
}

/** The agent CLI itself is absent. Local-model injection needs the CLI but
 * does not need its cloud account to be signed in. */
export function needsCli(instance: InstanceInfo | undefined): boolean {
  return instance?.snapshot.state !== "available";
}

function CommandRow({ command, actionLabel }: { command: string; actionLabel: string }) {
  const [status, setStatus] = useState<"copied" | "opened" | null>(null);
  const canOpen = Boolean(window.ogb?.openInstallTerminal);

  const settle = (next: "copied" | "opened") => {
    setStatus(next);
    window.setTimeout(() => setStatus(null), 2200);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      settle("copied");
    } catch {
      // The command remains selectable when clipboard access is blocked.
    }
  };

  const openTerminal = async () => {
    const opened = await window.ogb!.openInstallTerminal!(command);
    settle(opened ? "opened" : "copied");
  };

  return (
    <div className="mt-3">
      <div className="flex min-w-0 items-center gap-2 rounded-lg border border-hairline/50 bg-app px-2.5 py-2">
        <code className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink-secondary" title={command}>
          {command}
        </code>
        {canOpen && (
          <button
            type="button"
            onClick={() => void copy()}
            aria-label="Copy command"
            title="Copy command"
            className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[11.5px] font-medium text-ink-secondary hover:bg-control hover:text-ink"
          >
            {status === "copied" ? <Check size={12} className="text-success" /> : <Copy size={12} />}
            {status === "copied" ? "Copied" : "Copy"}
          </button>
        )}
      </div>

      {canOpen ? (
        <>
          <button
            type="button"
            onClick={() => void openTerminal()}
            className="mt-2 flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-accent px-3 py-2 text-[12.5px] font-semibold text-white hover:brightness-110"
          >
            {status === "opened" ? <Check size={14} /> : <TerminalSquare size={14} />}
            {status === "opened" ? "Terminal opened" : actionLabel}
          </button>
          <p aria-live="polite" className="mt-1.5 text-center text-[11px] text-ink-secondary/70">
            {status === "opened" ? "Paste the command and press Enter." : "The command is copied when Terminal opens."}
          </p>
        </>
      ) : (
        <button
          type="button"
          onClick={() => void copy()}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-control px-3 py-2 text-[12.5px] font-semibold text-ink hover:bg-raised-hover"
        >
          {status === "copied" ? <Check size={14} className="text-success" /> : <Copy size={14} />}
          {status === "copied" ? "Command copied" : "Copy command"}
        </button>
      )}
    </div>
  );
}

function SettingsRedirectSetup({
  className,
  section,
  action,
  title,
  description,
}: {
  className?: string;
  section: AppSettingsSection;
  action: string;
  title: string;
  description: string;
}) {
  const { dispatch } = useStore();
  return (
    <div className={cn("rounded-xl border border-hairline/40 bg-control/30 p-3", className)}>
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-inset text-ink-secondary">
          <Settings2 size={14} />
        </span>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-ink">{title}</div>
          <p className="mt-0.5 text-[12px] leading-relaxed text-ink-secondary">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => dispatch({ type: "toggleAppSettings", open: true, section })}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-[12.5px] font-semibold text-white hover:brightness-110"
      >
        {action}
      </button>
    </div>
  );
}

export function EngineSetup({
  instance,
  className,
  intent = "cloud",
}: {
  instance: InstanceInfo;
  className?: string;
  /** `inject` installs the CLI but deliberately skips cloud sign-in. */
  intent?: "cloud" | "inject";
}) {
  if (instance.driverKind === "openai-compat") {
    return <OpenRouterSetup instance={instance} className={className} />;
  }

  if (instance.driverKind === "boxAgent") {
    return (
      <SettingsRedirectSetup
        className={className}
        section="connections"
        action="Open Connections"
        title={`${instance.displayName} is set up in Settings`}
        description="Add the Box API key under Settings → Connections. This menu only picks Computer after that key is saved."
      />
    );
  }

  const install = instance.install;
  const installCommand = installCommandFor(install);
  const signInCommand = install?.signInCommand;
  const signInOnly = intent === "cloud" && needsSignIn(instance);
  const command = signInOnly ? signInCommand : installCommand;
  const title = signInOnly ? `Sign in to ${instance.displayName}` : `Install ${instance.displayName}`;
  const description = signInOnly
    ? "Finish the account sign-in in Terminal. Reopen this menu afterward and we’ll check again."
    : intent === "inject"
      ? "Install the agent once, then you can run it with local models—no cloud sign-in required."
      : `Install the command-line app once. Models will appear here as soon as it’s ready${signInCommand ? "; sign-in may follow" : ""}.`;

  // Some engines are configured elsewhere (for example, a cloud computer
  // token) and intentionally have no install descriptor.
  if (!install) {
    return (
      <div className={cn("rounded-xl border border-hairline/40 bg-control/30 p-3", className)}>
        <div className="text-[13px] font-semibold text-ink">{instance.displayName} isn’t ready</div>
        <p className="mt-1 text-[12px] leading-relaxed text-ink-secondary">
          {instance.snapshot.reason ?? "This engine is not available on this machine."}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-hairline/40 bg-control/30 p-3", className)}>
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-inset text-ink-secondary">
          {signInOnly ? <LogIn size={14} /> : <Download size={14} />}
        </span>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-ink">{title}</div>
          <p className="mt-0.5 text-[12px] leading-relaxed text-ink-secondary">{description}</p>
        </div>
      </div>

      {command ? (
        <CommandRow command={command} actionLabel={signInOnly ? "Open sign-in in Terminal" : "Open install in Terminal"} />
      ) : (
        <p className="mt-3 rounded-lg bg-inset px-2.5 py-2 text-[12px] leading-relaxed text-ink-secondary">
          There isn’t a one-line installer for this platform. Use the setup guide below.
        </p>
      )}

      {!signInOnly && install.needsNode && (
        <p className="mt-2 text-[11px] leading-relaxed text-ink-secondary/70">
          Requires Node.js and <code className="font-mono">npm</code>.
        </p>
      )}

      {install.docsUrl && (
        <a
          href={install.docsUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] font-medium text-accent hover:underline"
        >
          <ExternalLink size={12} /> View setup guide
        </a>
      )}
    </div>
  );
}
