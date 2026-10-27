import { describe, expect, it, vi } from "vitest";
import { APP_UPDATE_STORAGE_KEY, startAppUpdateChecks, type AppUpdateHost } from "@/lib/app-updates";

const A = "a".repeat(40), B = "b".repeat(40);
const health = (over: object = {}) => Response.json({ ok: true, product: "bible-compass", surface: "production", commit: B, ...over });
function host(over: Partial<AppUpdateHost> = {}, response: () => Promise<Response> = async () => health()) {
  const store = new Map<string, string>(); const listeners: Record<string, () => void> = {};
  const h: AppUpdateHost & { listeners: typeof listeners; store: typeof store } = {
    isVisible: () => true, isOnline: () => true, now: () => 1000, fetch: vi.fn(response), reload: vi.fn(),
    storage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) },
    on: (e: string, l: () => void) => { listeners[e] = l; return () => delete listeners[e]; }, setTimer: (cb: () => void, ms: number) => setTimeout(cb, ms), clearTimer: (t: unknown) => clearTimeout(t as number),
    listeners, store, ...over,
  } as never;
  return h;
}
const flush = () => new Promise(r => setTimeout(r, 0));

describe("startAppUpdateChecks", () => {
  it("ignores local or invalid builds", () => {
    const h = host(); startAppUpdateChecks({ commit: "x", surface: "production" }, h)(); startAppUpdateChecks({ commit: A, surface: null }, h);
    expect(h.fetch).not.toHaveBeenCalled();
  });
  it("reloads once for a new build and respects the cooldown marker", async () => {
    const h = host(); const stop = startAppUpdateChecks({ commit: A, surface: "production" }, h); await flush();
    expect(h.reload).toHaveBeenCalledTimes(1); expect(JSON.parse(h.store.get(APP_UPDATE_STORAGE_KEY)!)).toMatchObject({ from: A, to: B });
    h.listeners.focus(); await flush(); expect(h.reload).toHaveBeenCalledTimes(1); stop();
  });
  it("replaces malformed markers and skips when unchanged, hidden, offline or unsafe", async () => {
    const h = host(); h.store.set(APP_UPDATE_STORAGE_KEY, "{bad"); startAppUpdateChecks({ commit: A, surface: "production" }, h); await flush(); expect(h.reload).toHaveBeenCalled();
    for (const o of [{}, { isVisible: () => false }, { isOnline: () => false }, { canReload: () => false }]) {
      const s = host(o, async () => health(Object.keys(o).length ? {} : { commit: A })); startAppUpdateChecks({ commit: A, surface: "production" }, s); await flush(); expect(s.reload).not.toHaveBeenCalled();
    }
  });
  it("ignores bad health responses and errors", async () => {
    for (const r of [async () => new Response("", { status: 500 }), async () => Response.json(null), async () => health({ ok: false }), async () => health({ surface: "preview" }), async () => { throw new Error("offline"); }]) {
      const h = host({}, r); startAppUpdateChecks({ commit: A, surface: "production" }, h); await flush(); expect(h.reload).not.toHaveBeenCalled();
    }
  });
  it("skips while in flight and aborts on timeout and dispose", async () => {
    vi.useFakeTimers();
    let resolve!: (r: Response) => void;
    const h = host({}, () => new Promise(r => { resolve = r; }));
    const stop = startAppUpdateChecks({ commit: A, surface: "preview" }, h);
    h.listeners.online(); expect(h.fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(10_001);
    resolve(health({ surface: "preview" })); await vi.advanceTimersByTimeAsync(1);
    expect(h.reload).not.toHaveBeenCalled();
    h.listeners.pageshow(); stop(); resolve(health({ surface: "preview" })); await vi.advanceTimersByTimeAsync(1);
    expect(h.reload).not.toHaveBeenCalled(); vi.useRealTimers();
  });
});
