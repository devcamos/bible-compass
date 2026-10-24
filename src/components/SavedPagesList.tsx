"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useSavedPages } from "./SavedPagesProvider";
import { SavedPagesError, type SavedEntry } from "@/lib/saved-pages";

export function SavedPagesList() {
  const { store, state, entries, pending, error } = useSavedPages();
  const [undo, setUndo] = useState<{ path: string; revision: string } | null>(null);
  const [notice, setNotice] = useState("");
  const [failure, setFailure] = useState("");
  const listRef = useRef<HTMLUListElement>(null);
  const undoRef = useRef<HTMLButtonElement>(null);
  const emptyRef = useRef<HTMLHeadingElement>(null);
  function focusPath(path?: string) {
    requestAnimationFrame(() => {
      const links = listRef.current?.querySelectorAll<HTMLAnchorElement>("a[data-reading]");
      const link = [...(links ?? [])].find((link) => link.dataset.reading === path);
      (link ?? links?.[0] ?? undoRef.current ?? emptyRef.current)?.focus();
    });
  }
  async function remove(entry: SavedEntry, index: number, control: HTMLButtonElement) {
    setFailure("");
    try {
      const result = await store.act({ type: "remove", path: entry.path });
      setUndo(result.undo ?? null);
      setNotice(result.changed ? "Page removed. You can undo this removal." : "This page was already removed.");
      const next = result.entries[Math.min(index, result.entries.length - 1)];
      focusPath(next?.path);
    } catch (error) {
      setFailure(error instanceof SavedPagesError ? error.message : "The page couldn't be removed. Nothing was changed. Try again.");
      requestAnimationFrame(() => { if (document.activeElement === document.body) control.focus(); });
    }
  }
  async function restore() {
    if (!undo) return;
    setFailure("");
    try {
      const result = await store.act({ type: "undo", ...undo });
      setNotice(result.conflict ? "This removal changed in another tab. Nothing was overwritten." : "Page restored.");
      const path = undo.path;
      setUndo(null);
      focusPath(path);
    } catch (error) {
      setFailure(error instanceof SavedPagesError ? error.message : "The page couldn't be restored. Nothing was changed. Try again.");
      requestAnimationFrame(() => { if (document.activeElement === document.body) undoRef.current?.focus(); });
    }
  }
  return <>
    <details className="mb-6 border-y border-border py-3"><summary className="cursor-pointer py-2 text-sm">About your saved pages</summary><p className="mb-1 mt-2 text-sm leading-6 text-muted-foreground">One list in this browser, up to 200 pages. Clearing browser data removes it. Saves do not sync across devices or keep an offline copy of Scripture. Private browsing may erase saves when it closes.</p></details>
    {state === "loading" ? <p role="status">Opening your saved pages…</p> : null}
    {state === "error" ? <div className="bc-callout" role="alert"><p>{error}</p><button type="button" className="bc-btn bc-btn--quiet" disabled={pending} onClick={() => { void store.refresh(); }}>Try again</button></div> : null}
    <div role="status" className="mb-3 text-sm text-muted-foreground">{notice}</div>
    {failure ? <p role="alert" className="mb-3 text-sm">{failure}</p> : null}
    {undo ? <div className="mb-4"><button ref={undoRef} type="button" className="bc-btn bc-btn--quiet" disabled={pending || state !== "ready"} onClick={() => { void restore(); }}>Undo removal</button></div> : null}
    {state === "ready" && !entries.length ? <section className="rounded-2xl border border-border bg-card p-5"><h2 ref={emptyRef} tabIndex={-1} className="bc-title bc-heading m-0 mb-3">A place to return to</h2><p className="mb-4 leading-7 text-muted-foreground">Choose Save page on a teaching, concept or Proverbs/Psalms reading. Your saved pages will appear here.</p><Link href="/" className="bc-btn bc-btn--quiet">Explore Scripture →</Link></section> : null}
    {state === "ready" && entries.length ? <><p className="mb-3 text-sm text-muted-foreground">{entries.length} saved {entries.length === 1 ? "page" : "pages"} · newest saves first</p><ul ref={listRef} className="m-0 list-none space-y-3 p-0">{entries.map((entry, index) => {
      const reading = store.readings.get(entry.path);
      if (!reading) return null;
      return <li key={entry.path} className="rounded-2xl border border-border bg-card p-5"><Link href={reading.path} prefetch={false} data-reading={reading.path} className="block min-h-11 text-foreground no-underline"><span className="mb-1 block text-sm text-muted-foreground">{reading.context}</span><span className="bc-title block text-xl leading-snug">{reading.title} <span aria-hidden="true">→</span></span></Link><button type="button" className="mt-2 inline-flex min-h-11 items-center text-sm text-link underline underline-offset-4 disabled:opacity-60" aria-label={`Remove ${reading.title}`} disabled={pending} onClick={(event) => { void remove(entry, index, event.currentTarget); }}>Remove</button></li>;
    })}</ul></> : null}
  </>;
}
