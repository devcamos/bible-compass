import { openSavedPages, readSavedPages, mutateSavedPage, holdSavedPagesReload, type SavedEntry, type SavedPageCommand } from "./saved-pages";
import type { ReadingPage } from "./saved-page-catalog";

type Snapshot = { state: "loading" | "ready" | "error"; entries: SavedEntry[]; pending: boolean; error: string | null };
const INITIAL: Snapshot = { state: "loading", entries: [], pending: false, error: null };
export class SavedPagesClient {
  private snapshot = INITIAL;
  private listeners = new Set<() => void>();
  private db: Promise<IDBDatabase> | null = null;
  private generation = 0;
  private channel: BroadcastChannel | null = null;
  private busy = 0;
  readonly allowed: ReadonlySet<string>;
  readonly readings: ReadonlyMap<string, ReadingPage>;
  constructor(catalog: ReadingPage[]) {
    this.readings = new Map(catalog.map((r) => [r.path, r]));
    this.allowed = new Set(this.readings.keys());
  }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getSnapshot = () => this.snapshot;
  getServerSnapshot = () => INITIAL;
  private publish(snapshot: Snapshot) {
    this.snapshot = snapshot;
    for (const listener of this.listeners) listener();
  }
  private database() {
    if (!this.db) {
      this.db = Promise.resolve().then(() => openSavedPages(window.indexedDB)).catch((error) => { this.db = null; throw error; });
    }
    return this.db;
  }
  refresh = async () => {
    const generation = ++this.generation;
    try {
      const entries = await readSavedPages(await this.database(), this.allowed);
      if (generation === this.generation) this.publish({ state: "ready", entries, pending: this.busy > 0, error: null });
    } catch {
      void this.db?.then((db) => db.close()).catch(() => {});
      this.db = null;
      if (generation === this.generation) this.publish({ ...this.snapshot, state: "error", pending: this.busy > 0,
        error: "Saved pages couldn't be opened safely on this device. Your reading is unaffected, and nothing has been erased." });
    }
  };
  start() {
    void this.refresh();
    const onVisible = () => { if (document.visibilityState === "visible") void this.refresh(); };
    window.addEventListener("focus", onVisible);
    window.addEventListener("pageshow", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    try { this.channel = new BroadcastChannel("bible-compass-saved-pages"); this.channel.onmessage = () => { void this.refresh(); }; }
    catch { /* Transactions remain atomic; refresh when this tab becomes visible. */ }
    return () => {
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("pageshow", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
      this.channel?.close(); this.channel = null;
    };
  }
  async act(command: SavedPageCommand) {
    const releaseReload = holdSavedPagesReload();
    this.busy += 1;
    this.generation += 1;
    this.publish({ ...this.snapshot, pending: true });
    try {
      const result = await mutateSavedPage(await this.database(), this.allowed, command);
      this.publish({ state: "ready", entries: result.entries, pending: true, error: null });
      try { this.channel?.postMessage("changed"); } catch { /* Focus/visibility refresh is the fallback. */ }
      await this.refresh();
      return result;
    } finally {
      releaseReload();
      this.busy -= 1;
      this.publish({ ...this.snapshot, pending: this.busy > 0 });
    }
  }
}
