"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  const focusedRow = useRef<{ path: string; index: number; control: HTMLElement } | null>(null);
  useEffect(() => {
    // Header pathname effects can run before this streamed page exists.
    // Transfer the requested focus only after the destination has mounted.
    if (location.hash !== "#saved-pages-heading") return;
    const frame = requestAnimationFrame(() => document.getElementById("saved-pages-heading")?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);
  function focusPath(path?: string) {
    requestAnimationFrame(() => {
      const links = listRef.current?.querySelectorAll<HTMLAnchorElement>("a[data-reading]");
      const link = [...(links ?? [])].find((link) => link.dataset.reading === path);
      (link ?? links?.[0] ?? undoRef.current ?? emptyRef.current)?.focus();
    });
  }
  useEffect(() => {
    const clearIfElsewhere = (event: Event) => {
      if (event.target instanceof Node && !listRef.current?.contains(event.target)) focusedRow.current = null;
    };
    document.addEventListener("focusin", clearIfElsewhere);
    document.addEventListener("pointerdown", clearIfElsewhere);
    return () => {
      document.removeEventListener("focusin", clearIfElsewhere);
      document.removeEventListener("pointerdown", clearIfElsewhere);
    };
  }, []);
  useEffect(() => {
    const previous = focusedRow.current;
    if (state === "ready" && previous && !previous.control.isConnected && document.activeElement === document.body) {
      const next = entries[Math.min(previous.index, entries.length - 1)];
      focusedRow.current = null;
      requestAnimationFrame(() => {
        const links = listRef.current?.querySelectorAll<HTMLAnchorElement>("a[data-reading]");
        const link = [...(links ?? [])].find((link) => link.dataset.reading === next?.path);
        (link ?? emptyRef.current)?.focus();
      });
    }
  }, [entries, state]);
  async function remove(entry: SavedEntry, index: number, control: HTMLButtonElement) {
    // This handler owns focus after its removal; external-refresh recovery must not compete.
    focusedRow.current = null;
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
    {state === "loading" ? <p role="status">Opening your saved pages…</p> : null}
    {state === "error" ? <div className="bc-callout" role="alert"><p>{error}</p><button type="button" className="bc-btn bc-btn--quiet" disabled={pending} onClick={() => { void store.refresh(); }}>Try again</button></div> : null}
    <div role="status" className="mb-3 text-sm text-muted-foreground">{notice}</div>
    {failure ? <p role="alert" className="mb-3 text-sm">{failure}</p> : null}
    {undo ? <div className="mb-4"><button ref={undoRef} type="button" className="bc-btn bc-btn--quiet" disabled={pending || state !== "ready"} onClick={() => { void restore(); }}>Undo removal</button></div> : null}
    {state === "ready" && !entries.length ? <section className="rounded-2xl border border-border bg-card p-8 text-center"><h2 ref={emptyRef} tabIndex={-1} className="bc-title bc-heading m-0 mb-3">No saved pages yet.</h2><p className="mb-4 leading-7 text-muted-foreground">Choose Save page on a teaching, concept or Proverbs/Psalms reading. Your saved pages will appear here.</p><Link href="/" className="bc-btn bc-btn--quiet">Explore Scripture →</Link></section> : null}
    {state === "ready" && entries.length ? <><p className="mb-3 text-sm text-muted-foreground">{entries.length} saved {entries.length === 1 ? "page" : "pages"} · newest saves first</p><ul ref={listRef} className="my-6 list-none border-b border-border p-0" onFocusCapture={(event) => {
      const row = event.target.closest<HTMLLIElement>("li[data-page]");
      if (row && event.target instanceof HTMLElement) focusedRow.current = { path: row.dataset.page!, index: entries.findIndex((entry) => entry.path === row.dataset.page), control: event.target };
    }}>{entries.map((entry, index) => {
      const reading = store.readings.get(entry.path);
      if (!reading) return null;
      return <li key={entry.path} data-page={entry.path} className="grid grid-cols-[minmax(0,1fr)_44px] items-start gap-3 border-t border-border py-5"><Link href={reading.path} prefetch={false} data-reading={reading.path} className="block min-h-11 text-foreground no-underline"><span className="bc-title block text-xl leading-snug">{reading.title}</span><span className="mt-2 block text-sm text-muted-foreground">{reading.context}</span></Link><button type="button" className="inline-flex h-11 w-11 items-center justify-center text-muted-foreground disabled:opacity-60" aria-label={`Remove ${reading.title}`} disabled={pending} onClick={(event) => { void remove(entry, index, event.currentTarget); }}><span aria-hidden="true" className="text-2xl">×</span></button></li>;
    })}</ul></> : null}
    <details className="my-6 border-b border-border py-3"><summary className="cursor-pointer py-2 text-sm">About your saved pages</summary><p className="mb-1 mt-2 text-sm leading-6 text-muted-foreground">One list in this browser, up to 200 pages. Clearing browser data removes it. Saves do not sync across devices or keep an offline copy of Scripture. Private browsing may erase saves when it closes.</p></details>
  </>;
}
