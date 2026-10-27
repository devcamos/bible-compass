import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it, vi } from "vitest";
import { holdSavedPagesReload, MAX_SAVED_PAGES, mutateSavedPage, openSavedPages, readSavedPages, SavedPagesError, savedPagesReloadSafe } from "@/lib/saved-pages";

const allowed = new Set(Array.from({ length: 1100 }, (_, i) => `/p${i}`));
const fresh = () => openSavedPages(new IDBFactory());
const put = (db: IDBDatabase, rows: unknown[]) => new Promise<void>((res, rej) => { const tx = db.transaction("pages", "readwrite"); for (const r of rows) tx.objectStore("pages").put(r); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); });

describe("saved pages store", () => {
  it("saves, removes, undoes and ignores no-ops", async () => {
    const db = await fresh();
    expect(await readSavedPages(db, allowed)).toEqual([]);
    expect((await mutateSavedPage(db, allowed, { type: "save", path: "/p1" })).changed).toBe(true);
    expect((await mutateSavedPage(db, allowed, { type: "save", path: "/p1" })).changed).toBe(false);
    const removed = await mutateSavedPage(db, allowed, { type: "remove", path: "/p1" });
    expect(removed.undo?.path).toBe("/p1");
    expect((await mutateSavedPage(db, allowed, { type: "remove", path: "/p1" })).changed).toBe(false);
    expect((await mutateSavedPage(db, allowed, { type: "remove", path: "/p2" })).changed).toBe(false);
    expect((await mutateSavedPage(db, allowed, { type: "undo", path: "/p1", revision: "wrong" })).conflict).toBe(true);
    expect((await mutateSavedPage(db, allowed, { type: "undo", path: "/p1", revision: removed.undo!.revision })).entries).toHaveLength(1);
    await mutateSavedPage(db, allowed, { type: "save", path: "/p2" });
    expect((await readSavedPages(db, allowed)).map(e => e.path)).toHaveLength(2);
  });
  it("rejects invalid commands and rows", async () => {
    const db = await fresh();
    for (const c of [null, { type: "x", path: "/p1" }, { type: "save", path: "/nope" }, { type: "save", path: "/p1", extra: 1 }, { type: "undo", path: "/p1", revision: "!" }]) await expect(mutateSavedPage(db, allowed, c as never)).rejects.toBeInstanceOf(SavedPagesError);
    await put(db, [{ path: "/p1", savedAt: 1, revision: "r", removed: false, extra: 1 }]);
    await expect(readSavedPages(db, allowed)).rejects.toBeInstanceOf(SavedPagesError);
    await expect(mutateSavedPage(db, allowed, { type: "save", path: "/p1" })).rejects.toBeInstanceOf(SavedPagesError);
    expect(savedPagesReloadSafe()).toBe(true);
  });
  it("enforces limits", async () => {
    const db = await fresh();
    await put(db, Array.from({ length: MAX_SAVED_PAGES }, (_, i) => ({ path: `/p${i}`, savedAt: i, revision: "r", removed: false })));
    await expect(mutateSavedPage(db, allowed, { type: "save", path: "/p999" })).rejects.toThrow(/up to/);
    await put(db, [{ path: "/p999", savedAt: 1, revision: "r", removed: false }]);
    await expect(readSavedPages(db, allowed)).rejects.toThrow(/limit/);
    const db2 = await fresh();
    await put(db2, Array.from({ length: 1000 }, (_, i) => ({ path: `/p${i}`, savedAt: i, revision: "r", removed: true })));
    await expect(mutateSavedPage(db2, allowed, { type: "save", path: "/p1050" })).rejects.toThrow(/full/);
    await put(db2, [{ path: "/p1001", savedAt: 1, revision: "r", removed: true }]);
    await expect(readSavedPages(db2, allowed)).rejects.toThrow(/too large/);
  });
  it("reload hold is idempotent", () => {
    const release = holdSavedPagesReload(); expect(savedPagesReloadSafe()).toBe(false); release(); release(); expect(savedPagesReloadSafe()).toBe(true);
  });
  it("open fails on error, blocked, timeout or missing store", async () => {
    const mk = (fire: (r: Record<string, unknown>) => void) => ({ open: () => { const r: Record<string, unknown> = {}; queueMicrotask(() => fire(r)); return r; } }) as unknown as IDBFactory;
    await expect(openSavedPages(mk(r => (r.onerror as () => void)()))).rejects.toBeInstanceOf(SavedPagesError);
    await expect(openSavedPages(mk(r => (r.onblocked as () => void)()))).rejects.toBeInstanceOf(SavedPagesError);
    const close = vi.fn();
    await expect(openSavedPages(mk(r => { r.result = { objectStoreNames: { contains: () => false }, close }; (r.onsuccess as () => void)(); }))).rejects.toBeInstanceOf(SavedPagesError);
    expect(close).toHaveBeenCalled();
    vi.useFakeTimers();
    const p = openSavedPages({ open: () => ({}) } as unknown as IDBFactory); const e = expect(p).rejects.toBeInstanceOf(SavedPagesError);
    await vi.advanceTimersByTimeAsync(10_001); await e; vi.useRealTimers();
    const db = await fresh(); db.onversionchange?.(new Event("versionchange") as IDBVersionChangeEvent);
  });
});
