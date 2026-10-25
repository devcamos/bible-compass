import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { IDBFactory } from "fake-indexeddb";
import { SAVED_PAGE_CATALOG } from "../src/lib/saved-page-catalog";
import { SavedPagesClient } from "../src/lib/saved-pages-client";
import { PSALMS_CATEGORIES, PSALMS_VERSES } from "../src/content/psalms";
import {
  MAX_SAVED_PAGES,
  SAVED_PAGES_DB_NAME,
  mutateSavedPage,
  openSavedPages,
  readSavedPages,
  savedPagesReloadSafe,
} from "../src/lib/saved-pages";

type Entry = Awaited<ReturnType<typeof readSavedPages>>[number];
type Command = Parameters<typeof mutateSavedPage>[2];

// These are explicit unit-test permissions, not a substitute for the application's
// content-derived catalog. Every fixture gets an isolated IndexedDB namespace.
const first = "/topics/faith";
const second = "/concepts/wisdom";
const third = "/psalms/trust-and-refuge/verses/psalm-23-1";
const allowed = new Set([first, second, third]);
const row = (path = first, savedAt = 100, revision = "fixture-revision", removed = false): Entry =>
  ({ path, savedAt, revision, removed });
const paths = (entries: Entry[]) => entries.map(entry => entry.path);

async function database(t: TestContext) {
  const factory = new IDBFactory();
  const db = await openSavedPages(factory);
  t.after(() => db.close());
  return { factory, db };
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error("Test transaction aborted"));
    transaction.onerror = () => reject(transaction.error ?? new Error("Test transaction failed"));
  });
}

async function seed(db: IDBDatabase, rows: unknown[]) {
  const transaction = db.transaction("pages", "readwrite");
  const done = transactionDone(transaction);
  for (const item of rows) transaction.objectStore("pages").put(item);
  await done;
}

async function rawRows(db: IDBDatabase): Promise<unknown[]> {
  const transaction = db.transaction("pages", "readonly");
  const done = transactionDone(transaction);
  const rows = await requestResult(transaction.objectStore("pages").getAll());
  await done;
  return rows;
}

function provideIndexedDBWindow(t: TestContext, factory: IDBFactory) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: { indexedDB: factory } });
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, "window", descriptor);
    else Reflect.deleteProperty(globalThis, "window");
  });
}

test("new saved-pages database is empty and owns only the path-keyed pages store", async t => {
  const { db } = await database(t);
  assert.equal(MAX_SAVED_PAGES, 200);
  assert.ok(SAVED_PAGES_DB_NAME.length > 0);
  assert.deepEqual(Array.from(db.objectStoreNames), ["pages"]);
  assert.equal(db.transaction("pages").objectStore("pages").keyPath, "path");
  assert.deepEqual(await readSavedPages(db, allowed), []);
  assert.equal(savedPagesReloadSafe(), true);
});

test("the real catalog saves representative routes from all supported reading families", async t => {
  const { db } = await database(t);
  const permissions = new Set(SAVED_PAGE_CATALOG.map(entry => entry.path));
  assert.equal(permissions.size, SAVED_PAGE_CATALOG.length);
  for (const entry of SAVED_PAGE_CATALOG) {
    assert.ok(entry.title.trim() && entry.context.trim(), entry.path);
    assert.match(entry.path, /^\/[a-z0-9/-]+$/);
  }
  const representatives = [first, second, "/proverbs", "/proverbs/words-and-speech",
    "/proverbs/verses/proverbs-3-5", "/psalms", "/psalms/trust-and-refuge", third,
    "/revelation", "/revelation/jesus-and-worship", "/revelation/jesus-and-worship/verses/revelation-1-17-18"];
  for (const path of representatives) {
    assert.ok(permissions.has(path), path);
    assert.equal((await mutateSavedPage(db, permissions, { type: "save", path })).changed, true);
  }
  assert.deepEqual(new Set(paths(await readSavedPages(db, permissions))), new Set(representatives));
  const confirmed = await rawRows(db);
  for (const path of ["/", "/saved", "/verse-of-the-day", "/how-to-use", "/concepts", "/concepts/data",
    "/feedback", "/api/feedback", "/health", "/designs/saved-pages.html", "/topics/unknown",
    "/psalms/praise-and-worship/verses/psalm-23-1"]) {
    assert.equal(permissions.has(path), false, path);
    await assert.rejects(mutateSavedPage(db, permissions, { type: "save", path }));
  }
  assert.deepEqual(await rawRows(db), confirmed);
});

test("the real catalog includes a Psalm passage only in its published category pairs", () => {
  const permissions = new Set(SAVED_PAGE_CATALOG.map(entry => entry.path));
  for (const verse of PSALMS_VERSES) {
    for (const category of PSALMS_CATEGORIES) {
      const path = `/psalms/${category.slug}/verses/${verse.id}`;
      assert.equal(permissions.has(path), verse.categorySlugs.includes(category.slug), path);
    }
  }
});

test("a confirmed save survives closing and reopening the same database", async t => {
  const { db, factory } = await database(t);
  const saved = await mutateSavedPage(db, allowed, { type: "save", path: first });
  assert.equal(saved.changed, true);
  assert.deepEqual(paths(saved.entries), [first]);
  assert.equal(saved.entries[0].removed, false);
  assert.ok(Number.isSafeInteger(saved.entries[0].savedAt) && saved.entries[0].savedAt > 0);
  assert.ok(typeof saved.entries[0].revision === "string" && saved.entries[0].revision.length > 0);
  db.close();
  const reopened = await openSavedPages(factory);
  t.after(() => reopened.close());
  assert.deepEqual(await readSavedPages(reopened, allowed), saved.entries);
});

test("saving an active page is idempotent and does not move or revise it", async t => {
  const { db } = await database(t);
  const rows = [row(first, 100, "older"), row(second, 200, "newer")];
  await seed(db, rows);
  const repeated = await mutateSavedPage(db, allowed, { type: "save", path: first });
  assert.equal(repeated.changed, false);
  assert.deepEqual(repeated.entries, [rows[1], rows[0]]);
  assert.deepEqual(await rawRows(db), [...rows].sort((a, b) => a.path.localeCompare(b.path)));
});

test("reads sort newest first with path ties and never expose tombstones", async t => {
  const { db } = await database(t);
  await seed(db, [row(first, 200, "a"), row(second, 200, "b"), row(third, 300, "c", true)]);
  assert.deepEqual(paths(await readSavedPages(db, allowed)), [second, first]);
});

test("exact route permissions reject normalization tricks, arbitrary hrefs and wrong Psalm pairs", async t => {
  const { db } = await database(t);
  await seed(db, [row()]);
  const original = await rawRows(db);
  const invalidPaths = [
    "", "/", "https://example.invalid/topics/faith", "//example.invalid/topics/faith",
    "javascript:alert(1)", "data:text/html,example", "\\\\example.invalid\\topics\\faith",
    `${first}/`, `${first}?theme=dark`, `${first}#heading`, `${first.toUpperCase()}`,
    "/topics/../topics/faith", "/topics/%66aith", "/topics/faith%2f", "/topics/faith\n",
    " /topics/faith", "/topics/missing", "/api/feedback", "/health", "/feedback",
    "/designs/saved-pages.html", "/psalms/praise-and-worship/verses/psalm-23-1",
    "/psalms/trust-and-refuge/verses/psalm-999-1",
  ];
  for (const path of invalidPaths) {
    for (const type of ["save", "remove", "undo"] as const) {
      const command = type === "undo" ? { type, path, revision: "invalid-token" } : { type, path };
      await assert.rejects(mutateSavedPage(db, allowed, command), `accepted ${type}: ${JSON.stringify(path)}`);
      assert.equal(savedPagesReloadSafe(), true);
    }
  }
  assert.deepEqual(await rawRows(db), original);
});

test("invalid runtime commands reject without changing the list", async t => {
  const { db } = await database(t);
  await seed(db, [row()]);
  const original = await rawRows(db);
  for (const value of [null, {}, { type: "clear", path: first }, { type: "save", path: 123 },
    { type: "undo", path: first }, { type: "undo", path: first, revision: "" }]) {
    await assert.rejects(mutateSavedPage(db, allowed, value as Command));
  }
  assert.deepEqual(await rawRows(db), original);
  assert.equal(savedPagesReloadSafe(), true);
});

test("simultaneous saves through separate connections preserve distinct pages", async t => {
  const { db, factory } = await database(t);
  const other = await openSavedPages(factory);
  t.after(() => other.close());
  const results = await Promise.all([
    mutateSavedPage(db, allowed, { type: "save", path: first }),
    mutateSavedPage(other, allowed, { type: "save", path: second }),
  ]);
  assert.ok(results.every(result => result.changed));
  const confirmed = await readSavedPages(db, allowed);
  assert.deepEqual(new Set(paths(confirmed)), new Set([first, second]));
  assert.deepEqual(await readSavedPages(other, allowed), confirmed);
});

test("simultaneous same-page saves produce one active row and one successful mutation", async t => {
  const { db, factory } = await database(t);
  const other = await openSavedPages(factory);
  t.after(() => other.close());
  const results = await Promise.all(Array.from({ length: 12 }, (_, index) =>
    mutateSavedPage(index % 2 ? db : other, allowed, { type: "save", path: first })));
  assert.equal(results.filter(result => result.changed).length, 1);
  assert.deepEqual(paths(await readSavedPages(db, allowed)), [first]);
  assert.equal((await rawRows(db)).length, 1);
});

test("remove commits a tombstone and its Undo token identifies that removal", async t => {
  const { db } = await database(t);
  await seed(db, [row()]);
  const removed = await mutateSavedPage(db, allowed, { type: "remove", path: first });
  assert.equal(removed.changed, true);
  assert.deepEqual(removed.entries, []);
  assert.ok(removed.undo);
  assert.equal(removed.undo.path, first);
  const [tombstone] = await rawRows(db) as Entry[];
  assert.equal(tombstone.removed, true);
  assert.equal(tombstone.revision, removed.undo.revision);
  assert.notEqual(tombstone.revision, "fixture-revision");
  const repeated = await mutateSavedPage(db, allowed, { type: "remove", path: first });
  assert.equal(repeated.changed, false);
  assert.deepEqual(await rawRows(db), [tombstone]);
});

test("removing an unsaved page is a no-op", async t => {
  const { db } = await database(t);
  const result = await mutateSavedPage(db, allowed, { type: "remove", path: first });
  assert.equal(result.changed, false);
  assert.deepEqual(result.entries, []);
  assert.deepEqual(await rawRows(db), []);
});

test("Undo restores only its matching removal and preserves a newer save from another connection", async t => {
  const { db, factory } = await database(t);
  const other = await openSavedPages(factory);
  t.after(() => other.close());
  await seed(db, [row(first, 100, "original"), row(second, 200, "unrelated")]);
  const removed = await mutateSavedPage(db, allowed, { type: "remove", path: first });
  assert.ok(removed.undo);
  const newer = await mutateSavedPage(other, allowed, { type: "save", path: third });
  const restored = await mutateSavedPage(db, allowed, { type: "undo", ...removed.undo });
  assert.equal(restored.changed, true);
  assert.deepEqual(new Set(paths(restored.entries)), new Set([first, second, third]));
  assert.deepEqual(restored.entries.find(entry => entry.path === third), newer.entries.find(entry => entry.path === third));
  assert.deepEqual(restored.entries.find(entry => entry.path === second), row(second, 200, "unrelated"));
  assert.equal(restored.entries.find(entry => entry.path === first)?.savedAt, 100);
  assert.equal(restored.entries[0].path, third);
});

test("a stale Undo cannot overwrite a page saved again in another connection", async t => {
  const { db, factory } = await database(t);
  const other = await openSavedPages(factory);
  t.after(() => other.close());
  await seed(db, [row()]);
  const removed = await mutateSavedPage(db, allowed, { type: "remove", path: first });
  assert.ok(removed.undo);
  const savedAgain = await mutateSavedPage(other, allowed, { type: "save", path: first });
  const stale = await mutateSavedPage(db, allowed, { type: "undo", ...removed.undo });
  assert.equal(stale.changed, false);
  assert.equal(stale.conflict, true);
  assert.deepEqual(stale.entries, savedAgain.entries);
  assert.deepEqual(await readSavedPages(other, allowed), savedAgain.entries);
});

test("an old Undo cannot resurrect a later removal, and replaying Undo conflicts", async t => {
  const { db } = await database(t);
  await seed(db, [row()]);
  const firstRemoval = await mutateSavedPage(db, allowed, { type: "remove", path: first });
  assert.ok(firstRemoval.undo);
  await mutateSavedPage(db, allowed, { type: "save", path: first });
  const lastRemoval = await mutateSavedPage(db, allowed, { type: "remove", path: first });
  assert.ok(lastRemoval.undo);
  assert.notEqual(firstRemoval.undo.revision, lastRemoval.undo.revision);
  const stale = await mutateSavedPage(db, allowed, { type: "undo", ...firstRemoval.undo });
  assert.equal(stale.conflict, true);
  assert.equal(stale.changed, false);
  assert.deepEqual(stale.entries, []);
  const restored = await mutateSavedPage(db, allowed, { type: "undo", ...lastRemoval.undo });
  assert.equal(restored.changed, true);
  const replay = await mutateSavedPage(db, allowed, { type: "undo", ...lastRemoval.undo });
  assert.equal(replay.changed, false);
  assert.equal(replay.conflict, true);
  assert.deepEqual(replay.entries, restored.entries);
});

test("an Undo for an absent page or mismatched token is an honest conflict", async t => {
  const { db } = await database(t);
  const absent = await mutateSavedPage(db, allowed, { type: "undo", path: first, revision: "missing" });
  assert.equal(absent.changed, false);
  assert.equal(absent.conflict, true);
  await seed(db, [row(first, 100, "current-removal", true)]);
  const wrong = await mutateSavedPage(db, allowed, { type: "undo", path: first, revision: "stale-removal" });
  assert.equal(wrong.changed, false);
  assert.equal(wrong.conflict, true);
  assert.deepEqual(await rawRows(db), [row(first, 100, "current-removal", true)]);
});

test("concurrent removals create one tombstone and Undo never restores an unrelated removal", async t => {
  const { db, factory } = await database(t);
  const other = await openSavedPages(factory);
  t.after(() => other.close());
  await seed(db, [row(first, 100, "a"), row(second, 200, "b")]);
  const removals = await Promise.all([
    mutateSavedPage(db, allowed, { type: "remove", path: first }),
    mutateSavedPage(other, allowed, { type: "remove", path: first }),
  ]);
  assert.equal(removals.filter(result => result.changed).length, 1);
  const token = removals.find(result => result.changed)?.undo;
  assert.ok(token);
  await mutateSavedPage(other, allowed, { type: "remove", path: second });
  const beforeUndo = await rawRows(db) as Entry[];
  const restored = await mutateSavedPage(db, allowed, { type: "undo", ...token });
  assert.equal(restored.changed, true);
  assert.deepEqual(paths(restored.entries), [first]);
  assert.deepEqual((await rawRows(db) as Entry[]).find(entry => entry.path === second),
    beforeUndo.find(entry => entry.path === second));
});

test("200 active rows is a hard atomic limit, while existing saves and removals still work", async t => {
  const { db, factory } = await database(t);
  const other = await openSavedPages(factory);
  t.after(() => other.close());
  const routes = Array.from({ length: MAX_SAVED_PAGES + 1 }, (_, index) => `/topics/limit-${index}`);
  const permissions = new Set(routes);
  await seed(db, routes.slice(0, MAX_SAVED_PAGES - 1).map(path => row(path)));
  const competing = await Promise.allSettled(routes.slice(-2).map((path, index) =>
    mutateSavedPage(index ? db : other, permissions, { type: "save", path })));
  assert.equal(competing.filter(result => result.status === "fulfilled").length, 1);
  assert.equal(competing.filter(result => result.status === "rejected").length, 1);
  const fullList = await readSavedPages(db, permissions);
  assert.equal(fullList.length, MAX_SAVED_PAGES);
  const missing = routes.find(path => !fullList.some(entry => entry.path === path));
  assert.ok(missing);
  assert.equal((await mutateSavedPage(db, permissions, { type: "save", path: routes[0] })).changed, false);
  const removed = await mutateSavedPage(db, permissions, { type: "remove", path: routes[0] });
  assert.ok(removed.undo);
  await mutateSavedPage(db, permissions, { type: "save", path: missing });
  const beforeUndo = await rawRows(db);
  await assert.rejects(mutateSavedPage(db, permissions, { type: "undo", ...removed.undo }));
  assert.deepEqual(await rawRows(db), beforeUndo);
  assert.equal((await readSavedPages(db, permissions)).length, MAX_SAVED_PAGES);
});

const malformedRows: [string, unknown][] = [
  ["missing fields", { path: second }],
  ["unsupported row shape", { ...row(second), version: 2 }],
  ["non-number timestamp", { ...row(second), savedAt: "100" }],
  ["negative timestamp", row(second, -1)],
  ["NaN timestamp", row(second, Number.NaN)],
  ["infinite timestamp", row(second, Number.POSITIVE_INFINITY)],
  ["fractional timestamp", row(second, 1.5)],
  ["missing revision", { path: second, savedAt: 100, removed: false }],
  ["empty revision", row(second, 100, "")],
  ["oversized revision", row(second, 100, "r".repeat(1_000_000))],
  ["invalid tombstone flag", { ...row(second), removed: "false" }],
  ["unknown content route", row("/topics/removed-content")],
  ["external stored destination", row("https://example.invalid")],
  ["stored query variant", row(`${second}?example=1`)],
];

for (const [name, invalid] of malformedRows) {
  test(`malformed stored data (${name}) rejects read and mutation without destructive recovery`, async t => {
    const { db } = await database(t);
    await seed(db, [row(), invalid]);
    const original = await rawRows(db);
    await assert.rejects(readSavedPages(db, allowed));
    await assert.rejects(mutateSavedPage(db, allowed, { type: "save", path: third }));
    assert.deepEqual(await rawRows(db), original);
    assert.equal(savedPagesReloadSafe(), true);
  });
}

test("an oversized active list rejects reads and mutations without trimming data", async t => {
  const { db } = await database(t);
  const routes = Array.from({ length: MAX_SAVED_PAGES + 1 }, (_, index) => `/topics/oversized-${index}`);
  const permissions = new Set([...routes, first]);
  await seed(db, routes.map(path => row(path)));
  const original = await rawRows(db);
  await assert.rejects(readSavedPages(db, permissions));
  await assert.rejects(mutateSavedPage(db, permissions, { type: "save", path: first }));
  assert.deepEqual(await rawRows(db), original);
});

test("oversized tombstone history is bounded and rejects without silently clearing it", async t => {
  const { db } = await database(t);
  const routes = Array.from({ length: 1001 }, (_, index) => `/topics/history-${index}`);
  const permissions = new Set([...routes, first]);
  await seed(db, routes.map(path => row(path, 100, "removed", true)));
  const original = await rawRows(db);
  await assert.rejects(readSavedPages(db, permissions));
  await assert.rejects(mutateSavedPage(db, permissions, { type: "save", path: first }));
  assert.deepEqual(await rawRows(db), original);
});

test("a real newer-version open failure rejects and preserves the unsupported database", async t => {
  const factory = new IDBFactory();
  const request = factory.open(SAVED_PAGES_DB_NAME, 99);
  request.onupgradeneeded = () => request.result.createObjectStore("pages", { keyPath: "path" });
  const future = await requestResult(request);
  t.after(() => future.close());
  await seed(future, [row()]);
  future.close();
  // The storage layer may present a safe user message rather than the raw
  // VersionError; the acceptance requirement is rejection and no reset/migration.
  await assert.rejects(openSavedPages(factory));
  const stillFuture = await requestResult(factory.open(SAVED_PAGES_DB_NAME, 99));
  t.after(() => stillFuture.close());
  assert.equal(stillFuture.version, 99);
  assert.deepEqual(await rawRows(stillFuture), [row()]);
});

test("a database with missing schema is unavailable rather than falsely empty", async t => {
  const factory = new IDBFactory();
  const incomplete = await requestResult(factory.open(SAVED_PAGES_DB_NAME, 1));
  t.after(() => incomplete.close());
  incomplete.close();
  await assert.rejects(openSavedPages(factory));
  const retained = await requestResult(factory.open(SAVED_PAGES_DB_NAME, 1));
  t.after(() => retained.close());
  assert.deepEqual(Array.from(retained.objectStoreNames), []);
});

test("a real fake-indexeddb blocked-open event rejects and closes a late successful connection", async t => {
  const factory = new IDBFactory();
  // A controlled version bump against an open old-schema connection produces
  // fake-indexeddb's actual blocked event. This is not a browser denial test.
  const oldConnection = await requestResult(factory.open(SAVED_PAGES_DB_NAME, 1));
  t.after(() => oldConnection.close());
  const originalOpen = factory.open.bind(factory);
  let lateCompletion!: Promise<IDBDatabase>;
  Object.defineProperty(factory, "open", {
    value: (name: string) => {
      const request = originalOpen(name, 2);
      lateCompletion = new Promise((resolve, reject) => {
        request.addEventListener("success", () => resolve(request.result));
        request.addEventListener("error", () => reject(request.error));
      });
      return request;
    },
  });
  await assert.rejects(openSavedPages(factory));
  oldConnection.close();
  const lateConnection = await lateCompletion;
  t.after(() => lateConnection.close());
  assert.throws(() => lateConnection.transaction("pages"), { name: "InvalidStateError" });
});

test("a closed database reports its transaction failure instead of false success", async t => {
  const { db } = await database(t);
  await seed(db, [row()]);
  db.close();
  await assert.rejects(readSavedPages(db, allowed), { name: "InvalidStateError" });
  await assert.rejects(mutateSavedPage(db, allowed, { type: "save", path: second }), { name: "InvalidStateError" });
  assert.equal(savedPagesReloadSafe(), true);
});

test("a real transaction abort rolls back its write and releases the reload guard", async t => {
  const { db } = await database(t);
  await seed(db, [row()]);
  const originalTransaction = db.transaction.bind(db);
  const descriptor = Object.getOwnPropertyDescriptor(db, "transaction");
  Object.defineProperty(db, "transaction", {
    configurable: true,
    value: (...args: Parameters<IDBDatabase["transaction"]>) => {
      const transaction = originalTransaction(...args);
      if (args[1] === "readwrite") queueMicrotask(() => transaction.abort());
      return transaction;
    },
  });
  try {
    const pending = mutateSavedPage(db, allowed, { type: "save", path: second });
    const safeWhilePending = savedPagesReloadSafe();
    await assert.rejects(pending);
    assert.equal(safeWhilePending, false);
    assert.equal(savedPagesReloadSafe(), true);
  } finally {
    if (descriptor) Object.defineProperty(db, "transaction", descriptor);
    else Reflect.deleteProperty(db, "transaction");
  }
  assert.deepEqual(await rawRows(db), [row()]);
});

test("the reload guard stays closed until every queued mutation has completed", async t => {
  const { db, factory } = await database(t);
  const other = await openSavedPages(factory);
  t.after(() => other.close());
  const blocker = db.transaction("pages", "readonly");
  let release = false;
  t.after(() => { release = true; });
  const keepAlive = () => {
    const request = blocker.objectStore("pages").get("__test_hold__");
    request.onsuccess = () => { if (!release) keepAlive(); };
  };
  keepAlive();
  const one = mutateSavedPage(db, allowed, { type: "save", path: first });
  const two = mutateSavedPage(other, allowed, { type: "save", path: second });
  assert.equal(savedPagesReloadSafe(), false);
  release = true;
  await one;
  assert.equal(savedPagesReloadSafe(), false);
  await two;
  assert.equal(savedPagesReloadSafe(), true);
  assert.deepEqual(new Set(paths(await readSavedPages(db, allowed))), new Set([first, second]));
});

test("client action holds the reload guard before database opening through committed refresh", async t => {
  const factory = new IDBFactory();
  provideIndexedDBWindow(t, factory);
  const opened: IDBDatabase[] = [];
  const originalOpen = factory.open.bind(factory);
  Object.defineProperty(factory, "open", {
    value: (...args: Parameters<IDBFactory["open"]>) => {
      const request = originalOpen(...args);
      request.addEventListener("success", () => { opened.push(request.result); });
      return request;
    },
  });
  t.after(() => { for (const db of opened) db.close(); });
  const client = new SavedPagesClient(SAVED_PAGE_CATALOG);
  const observations: { pending: boolean; safe: boolean }[] = [];
  client.subscribe(() => observations.push({ pending: client.getSnapshot().pending, safe: savedPagesReloadSafe() }));
  const pending = client.act({ type: "save", path: first });
  // database() opens in a following microtask, so this checks the gap before any
  // core transaction exists, using the actual client and actual IDB operations.
  assert.equal(opened.length, 0);
  assert.equal(savedPagesReloadSafe(), false);
  const result = await pending;
  assert.equal(result.changed, true);
  assert.deepEqual(paths(client.getSnapshot().entries), [first]);
  assert.equal(client.getSnapshot().state, "ready");
  assert.equal(client.getSnapshot().pending, false);
  assert.equal(savedPagesReloadSafe(), true);
  assert.ok(observations.length >= 3);
  assert.ok(observations.every(({ pending, safe }) => pending ? !safe : safe));
  assert.deepEqual(await readSavedPages(opened[0], new Set(SAVED_PAGE_CATALOG.map(entry => entry.path))), result.entries);
});

test("client action releases the reload guard on a real database-open version failure", async t => {
  const factory = new IDBFactory();
  provideIndexedDBWindow(t, factory);
  const request = factory.open(SAVED_PAGES_DB_NAME, 99);
  request.onupgradeneeded = () => request.result.createObjectStore("pages", { keyPath: "path" });
  const future = await requestResult(request);
  t.after(() => future.close());
  await seed(future, [row()]);
  future.close();
  const client = new SavedPagesClient(SAVED_PAGE_CATALOG);
  const pending = client.act({ type: "save", path: second });
  const safeWhileOpening = savedPagesReloadSafe();
  await assert.rejects(pending);
  assert.equal(safeWhileOpening, false);
  assert.equal(savedPagesReloadSafe(), true);
  assert.equal(client.getSnapshot().pending, false);
  assert.deepEqual(client.getSnapshot().entries, []);
  const retained = await requestResult(factory.open(SAVED_PAGES_DB_NAME, 99));
  t.after(() => retained.close());
  assert.deepEqual(await rawRows(retained), [row()]);
});
