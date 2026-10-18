import assert from "node:assert/strict";
import { test } from "node:test";
import { setImmediate } from "node:timers/promises";
import { GET as health } from "../src/app/health/route";
import { APP_UPDATE_COOLDOWN_MS, APP_UPDATE_STORAGE_KEY, APP_UPDATE_TIMEOUT_MS, startAppUpdateChecks, type AppUpdateHost } from "../src/lib/app-updates";

const oldCommit = "a".repeat(40);
const newCommit = "b".repeat(40);
const build = { commit: oldCommit, surface: "production" };
const payload = (commit = oldCommit) => ({ ok: true, product: "bible-compass", surface: "production", commit });
const response = (value: unknown = payload()) => Response.json(value);
const flush = async () => { await setImmediate(); await setImmediate(); };

function fixture(storage = new Map<string, string>()) {
  const listeners = new Map<string, Set<() => void>>();
  const timers = new Map<number, { callback: () => void; ms: number }>();
  const defaultFetch: AppUpdateHost["fetch"] = async () => response();
  const state = { visible: true, online: true, now: 1_000, reloads: 0, calls: [] as { url: string; init: RequestInit }[], fetch: defaultFetch };
  let nextTimer = 0;
  const host: AppUpdateHost = {
    isVisible: () => state.visible,
    isOnline: () => state.online,
    now: () => state.now,
    fetch: (url, init) => { state.calls.push({ url, init }); return state.fetch(url, init); },
    storage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => { storage.set(key, value); } },
    reload: () => { state.reloads++; },
    on: (event, listener) => { const group = listeners.get(event) ?? new Set(); group.add(listener); listeners.set(event, group); return () => { group.delete(listener); }; },
    setTimer: (callback, ms) => { const id = ++nextTimer; timers.set(id, { callback, ms }); return id; },
    clearTimer: handle => { timers.delete(handle as number); },
  };
  return { host, state, storage, listeners, timers, emit: (name: string) => { listeners.get(name)?.forEach(listener => listener()); } };
}

test("opens check current deployment without cache; same version never reloads", async () => {
  const f = fixture(); const stop = startAppUpdateChecks(build, f.host); await flush();
  assert.equal(f.state.calls.length, 1);
  assert.equal(f.state.calls[0].url, "/health");
  assert.equal(f.state.calls[0].init.cache, "no-store");
  assert.equal(f.state.calls[0].init.redirect, "error");
  assert.equal(f.state.calls[0].init.credentials, "same-origin");
  assert.equal(f.state.reloads, 0); assert.equal(f.storage.size, 0); stop();
});

test("foreground/page restore/focus/reconnect discover new deployments without touching preferences", async () => {
  for (const event of ["visibilitychange", "pageshow", "focus", "online"]) {
    const storage = new Map([["bible-compass-theme", "dark"], ["push-management-token", "retained"]]);
    const f = fixture(storage); const stop = startAppUpdateChecks(build, f.host); await flush();
    f.state.fetch = async () => response(payload(newCommit)); f.emit(event); await flush();
    assert.equal(f.state.reloads, 1, event);
    assert.equal(storage.get("bible-compass-theme"), "dark"); assert.equal(storage.get("push-management-token"), "retained");
    assert.deepEqual(JSON.parse(storage.get(APP_UPDATE_STORAGE_KEY)!), { from: oldCommit, to: newCommit, at: f.state.now }); stop();
  }
});

test("hidden/offline reading is undisturbed; becoming visible/online retries", async () => {
  const f = fixture(); f.state.visible = false; f.state.online = false;
  f.state.fetch = async () => response(payload(newCommit)); const stop = startAppUpdateChecks(build, f.host); await flush();
  assert.equal(f.state.calls.length, 0);
  f.state.visible = true; f.emit("visibilitychange"); await flush(); assert.equal(f.state.calls.length, 0);
  f.state.online = true; f.emit("online"); await flush(); assert.equal(f.state.reloads, 1); stop();
});

test("burst events share a request, and timeouts release stalled probes for a later reopening", async () => {
  const f = fixture(); let settle: ((value: Response) => void) | undefined;
  f.state.fetch = () => new Promise(resolve => { settle = resolve; });
  const stop = startAppUpdateChecks(build, f.host);
  for (const event of ["focus", "pageshow", "visibilitychange", "online"]) f.emit(event);
  assert.equal(f.state.calls.length, 1);
  const timeout = [...f.timers.values()].find(timer => timer.ms === APP_UPDATE_TIMEOUT_MS)!; assert.ok(timeout); timeout.callback();
  assert.equal(f.state.calls[0].init.signal?.aborted, true);
  f.state.fetch = async () => response(payload(newCommit)); f.emit("focus"); await flush(); assert.equal(f.state.reloads, 1);
  settle!(response(payload("c".repeat(40)))); await flush(); assert.equal(f.state.reloads, 1, "aborted response must not trigger another reload"); stop();
});

test("untrusted responses, errors and wrong environments never trigger navigation", async () => {
  for (const value of [null, [], {}, { ...payload(newCommit), ok: false }, { ...payload(newCommit), product: "other" }, { ...payload(newCommit), surface: "preview" }, { ...payload(newCommit), commit: "https://evil.test" }, { ...payload(newCommit), commit: "local" }]) {
    const f = fixture(); f.state.fetch = async () => response(value); const stop = startAppUpdateChecks(build, f.host); await flush(); assert.equal(f.state.reloads, 0); stop();
  }
  for (const fetch of [async () => new Response("Unavailable", { status: 503 }), async () => new Response("not-json"), async () => { throw new Error("Offline"); }]) {
    const f = fixture(); f.state.fetch = fetch; const stop = startAppUpdateChecks(build, f.host); await flush(); assert.equal(f.state.reloads, 0);
    f.state.fetch = async () => response(payload(newCommit)); f.emit("online"); await flush(); assert.equal(f.state.reloads, 1); stop();
  }
});

test("stale HTML cannot loop reloads, but a later reopening retries after cooldown", async () => {
  const storage = new Map<string, string>();
  for (const [now, expected] of [[1_000, 1], [1_001, 0], [1_000 + APP_UPDATE_COOLDOWN_MS, 1]]) {
    const f = fixture(storage); f.state.now = now; f.state.fetch = async () => response(payload(newCommit));
    const stop = startAppUpdateChecks(build, f.host); await flush(); assert.equal(f.state.reloads, expected); stop();
  }
  const f = fixture(storage); f.state.fetch = async () => response(payload("c".repeat(40))); const stop = startAppUpdateChecks(build, f.host); await flush(); assert.equal(f.state.reloads, 1, "a distinct newer deployment is not suppressed"); stop();
});

test("a browser that ignores reload can retry on a later foreground event", async () => {
  const f = fixture(); f.state.fetch = async () => response(payload(newCommit)); const stop = startAppUpdateChecks(build, f.host); await flush();
  f.emit("focus"); await flush(); assert.equal(f.state.reloads, 1);
  f.state.now += APP_UPDATE_COOLDOWN_MS; f.emit("pageshow"); await flush(); assert.equal(f.state.reloads, 2); stop();
});

test("corrupt markers are replaced, but unavailable storage keeps the reader usable", async () => {
  const f = fixture(new Map([[APP_UPDATE_STORAGE_KEY, "invalid-json"]])); f.state.fetch = async () => response(payload(newCommit));
  const stop = startAppUpdateChecks(build, f.host); await flush(); assert.equal(f.state.reloads, 1); stop();
  for (const operation of ["getItem", "setItem"] as const) {
    const blocked = fixture(); blocked.state.fetch = async () => response(payload(newCommit)); blocked.host.storage[operation] = () => { throw new Error("Storage denied"); };
    const cleanup = startAppUpdateChecks(build, blocked.host); await flush(); assert.equal(blocked.state.reloads, 0); cleanup();
  }
});

test("cleanup removes lifecycle listeners and ignores late responses", async () => {
  const f = fixture(); let settle: ((value: Response) => void) | undefined; f.state.fetch = () => new Promise(resolve => { settle = resolve; });
  const stop = startAppUpdateChecks(build, f.host); stop(); assert.equal(f.state.calls[0].init.signal?.aborted, true);
  assert.equal([...f.listeners.values()].reduce((sum, group) => sum + group.size, 0), 0); assert.equal(f.timers.size, 0);
  settle!(response(payload(newCommit))); await flush(); assert.equal(f.state.reloads, 0);
});

test("local/invalid builds do not probe; Preview updates remain confined to Preview", async () => {
  for (const invalid of [{ commit: "local", surface: "local" }, { commit: null, surface: "production" }, { commit: oldCommit, surface: "unknown" }]) {
    const f = fixture(); const stop = startAppUpdateChecks(invalid, f.host); await flush(); assert.equal(f.state.calls.length, 0); stop();
  }
  const f = fixture(); f.state.fetch = async () => response({ ...payload(newCommit), surface: "preview" });
  const stop = startAppUpdateChecks({ ...build, surface: "preview" }, f.host); await flush(); assert.equal(f.state.reloads, 1); stop();
});

test("deployment health responses cannot be cached", async () => {
  const result = health(); assert.equal(result.headers.get("cache-control"), "no-store"); assert.equal((await result.json()).product, "bible-compass");
});
