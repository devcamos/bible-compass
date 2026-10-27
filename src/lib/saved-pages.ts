/** Browser-only data. No Scripture copies, contacts, preferences or push data. */
export const SAVED_PAGES_DB_NAME = "bible-compass-saved-pages";
export const MAX_SAVED_PAGES = 200;
const MAX_RECORDS = 1000;
export type SavedEntry = { path: string; savedAt: number; revision: string; removed: boolean };
export type SavedPageCommand = { type: "save" | "remove"; path: string } | { type: "undo"; path: string; revision: string };
export type MutationResult = { changed: boolean; entries: SavedEntry[]; undo?: { path: string; revision: string }; conflict?: boolean };
let pendingWrites = 0;
export function savedPagesReloadSafe() { return pendingWrites === 0; }
export function holdSavedPagesReload() {
  pendingWrites += 1;
  let released = false;
  return () => { if (!released) { released = true; pendingWrites -= 1; } };
}
export class SavedPagesError extends Error {}

export function openSavedPages(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const request = factory.open(SAVED_PAGES_DB_NAME, 1);
    const fail = () => {
      settled = true;
      clearTimeout(timer);
      reject(new SavedPagesError("Saved pages are unavailable in this browser. Your reading is unaffected."));
    };
    const timer = setTimeout(fail, 10_000);
    request.onupgradeneeded = () => request.result.createObjectStore("pages", { keyPath: "path" });
    request.onerror = fail;
    request.onblocked = fail;
    request.onsuccess = () => {
      clearTimeout(timer);
      const db = request.result;
      if (settled || !db.objectStoreNames.contains("pages")) { db.close(); if (!settled) fail(); return; }
      settled = true;
      db.onversionchange = () => db.close();
      resolve(db);
    };
  });
}

function validateRows(rows: unknown[], allowed: ReadonlySet<string>): SavedEntry[] {
  if (rows.length > MAX_RECORDS) throw new SavedPagesError("The saved list is too large to read safely. Nothing has been changed.");
  for (const row of rows) {
    const r = row as Partial<SavedEntry> | null;
    if (!r || typeof r !== "object" || typeof r.path !== "string" || r.path.length > 200 || !allowed.has(r.path)
      || typeof r.savedAt !== "number" || !Number.isSafeInteger(r.savedAt) || r.savedAt < 0
      || typeof r.revision !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(r.revision) || typeof r.removed !== "boolean"
      || Object.keys(r).length !== 4) {
      throw new SavedPagesError("Saved pages couldn't be read safely. Nothing has been changed. Try again after updating the app.");
    }
  }
  const entries = rows as SavedEntry[];
  if (entries.filter((r) => !r.removed).length > MAX_SAVED_PAGES) throw new SavedPagesError("The saved list exceeds its supported limit. Nothing has been changed.");
  return entries;
}

function active(rows: SavedEntry[]) {
  return rows.filter((r) => !r.removed).sort((a, b) => b.savedAt - a.savedAt || a.path.localeCompare(b.path));
}

function transact(db: IDBDatabase, allowed: ReadonlySet<string>, command?: SavedPageCommand): Promise<MutationResult> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pages", command ? "readwrite" : "readonly");
    const store = tx.objectStore("pages");
    let result: MutationResult;
    let failure: unknown;
    tx.onabort = () => reject(failure ?? new SavedPagesError("The change couldn't be saved on this device. Nothing was changed. Try again."));
    tx.onerror = () => { /* onabort reports failure only after the transaction is rolled back. */ };
    tx.oncomplete = () => resolve(result);
    const request = store.getAll(undefined, MAX_RECORDS + 1);
    request.onsuccess = () => {
      try {
        const rows = validateRows(request.result, allowed);
        result = { changed: false, entries: active(rows) };
        if (!command) return;
        if (!allowed.has(command.path)) throw new SavedPagesError("This page cannot be saved.");
        const previous = rows.find((r) => r.path === command.path);
        if (command.type === "save" && previous && !previous.removed) return;
        if (command.type === "remove" && (!previous || previous.removed)) return;
        if (command.type === "undo" && (!previous?.removed || previous.revision !== command.revision)) {
          result.conflict = true;
          return;
        }
        if (command.type !== "remove" && result.entries.length >= MAX_SAVED_PAGES) throw new SavedPagesError(`You can save up to ${MAX_SAVED_PAGES} pages. Remove a page before saving another.`);
        if (!previous && rows.length >= MAX_RECORDS) throw new SavedPagesError("This saved list is full. Nothing was changed.");
        const entry: SavedEntry = {
          path: command.path,
          savedAt: command.type === "save" ? Date.now() : previous!.savedAt,
          revision: crypto.randomUUID(),
          removed: command.type === "remove",
        };
        store.put(entry);
        result = {
          changed: true,
          entries: active([...rows.filter((r) => r.path !== entry.path), entry]),
          ...(entry.removed ? { undo: { path: entry.path, revision: entry.revision } } : {}),
        };
      } catch (error) { failure = error; tx.abort(); }
    };
  });
}

export async function readSavedPages(db: IDBDatabase, allowed: ReadonlySet<string>) {
  return (await transact(db, allowed)).entries;
}

export async function mutateSavedPage(db: IDBDatabase, allowed: ReadonlySet<string>, command: SavedPageCommand) {
  if (!command || typeof command !== "object" || !["save", "remove", "undo"].includes(command.type)
    || typeof command.path !== "string" || !allowed.has(command.path)
    || Object.keys(command).length !== (command.type === "undo" ? 3 : 2)
    || (command.type === "undo" && (typeof command.revision !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(command.revision)))) {
    throw new SavedPagesError("This page cannot be saved. Nothing has been changed.");
  }
  pendingWrites += 1;
  try { return await transact(db, allowed, command); }
  finally { pendingWrites -= 1; }
}
