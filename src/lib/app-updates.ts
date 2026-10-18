export const APP_UPDATE_STORAGE_KEY = "bible-compass-app-update";
export const APP_UPDATE_COOLDOWN_MS = 60_000;
export const APP_UPDATE_TIMEOUT_MS = 10_000;

type UpdateEvent = "visibilitychange" | "focus" | "pageshow" | "online";

export interface AppUpdateHost {
  isVisible(): boolean;
  isOnline(): boolean;
  now(): number;
  fetch(url: string, init: RequestInit): Promise<Response>;
  storage: Pick<Storage, "getItem" | "setItem">;
  reload(): void;
  on(event: UpdateEvent, listener: () => void): () => void;
  setTimer(callback: () => void, ms: number): unknown;
  clearTimer(handle: unknown): void;
}

type Build = { commit: string | null; surface: string | null };

function validCommit(commit: unknown): commit is string {
  return typeof commit === "string" && /^[a-f0-9]{40}$/i.test(commit);
}

/** Check on opening/resuming the reader; never cache pages or poll in the background. */
export function startAppUpdateChecks(build: Build, host: AppUpdateHost): () => void {
  if (!validCommit(build.commit) || (build.surface !== "production" && build.surface !== "preview")) {
    return () => {};
  }

  const currentCommit = build.commit.toLowerCase();
  let disposed = false;
  let inFlight: AbortController | null = null;
  let timeout: unknown;

  async function check() {
    if (disposed || inFlight || !host.isVisible() || !host.isOnline()) return;
    const controller = new AbortController();
    inFlight = controller;
    timeout = host.setTimer(() => {
      controller.abort();
      if (inFlight === controller) inFlight = null;
    }, APP_UPDATE_TIMEOUT_MS);
    const requestTimeout = timeout;

    try {
      const response = await host.fetch("/health", {
        cache: "no-store",
        credentials: "same-origin",
        redirect: "error",
        signal: controller.signal,
      });
      if (!response.ok) return;
      const health: unknown = await response.json();
      if (!health || typeof health !== "object") return;
      const version = health as Record<string, unknown>;
      if (disposed || controller.signal.aborted || !host.isVisible() || !host.isOnline()
        || version.ok !== true || version.product !== "bible-compass"
        || version.surface !== build.surface || !validCommit(version.commit)) return;

      const nextCommit = version.commit.toLowerCase();
      if (nextCommit === currentCommit) return;

      // A stale document must not cause a reload loop. This guard expires rather
      // than permanently suppressing the same update on a later app opening.
      const now = host.now();
      const stored = host.storage.getItem(APP_UPDATE_STORAGE_KEY);
      if (stored) {
        let previous: unknown;
        try { previous = JSON.parse(stored); } catch { /* Replace our malformed marker. */ }
        if (previous && typeof previous === "object") {
          const marker = previous as Record<string, unknown>;
          if (marker.from === currentCommit && marker.to === nextCommit
            && typeof marker.at === "number" && Number.isFinite(marker.at)
            && now >= marker.at && now - marker.at < APP_UPDATE_COOLDOWN_MS) return;
        }
      }
      // If storage is blocked, leave the reader working instead of risking a loop.
      host.storage.setItem(APP_UPDATE_STORAGE_KEY, JSON.stringify({ from: currentCommit, to: nextCommit, at: now }));
      host.reload();
    } catch {
      // Offline, unavailable health, storage or navigation must not interrupt reading.
    } finally {
      host.clearTimer(requestTimeout);
      if (inFlight === controller) inFlight = null;
    }
  }

  const onOpen = () => { void check(); };
  const unsubscribe = (["visibilitychange", "focus", "pageshow", "online"] as const)
    .map((event) => host.on(event, onOpen));
  onOpen();

  return () => {
    disposed = true;
    inFlight?.abort();
    host.clearTimer(timeout);
    unsubscribe.forEach((removeListener) => removeListener());
  };
}
