"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useSavedPages } from "./SavedPagesProvider";
import { SavedPagesError } from "@/lib/saved-pages";

export function BookmarkIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4V3Z" strokeLinejoin="round" /></svg>;
}

export function SavedPageActions({ path }: { path: string }) {
  const { store, state, entries, pending, error } = useSavedPages();
  const [notice, setNotice] = useState("");
  const [failure, setFailure] = useState("");
  const [undo, setUndo] = useState<{ path: string; revision: string } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const undoRef = useRef<HTMLButtonElement>(null);
  const saved = entries.some((entry) => entry.path === path);
  async function toggle() {
    setFailure("");
    try {
      const result = await store.act({ type: saved ? "remove" : "save", path });
      setUndo(result.undo ?? null);
      setNotice(saved ? "Removed from saved pages." : "Saved on this device.");
    } catch (error) {
      setNotice("");
      setFailure(error instanceof SavedPagesError ? error.message : "This change couldn't be saved. Nothing was changed. Try again.");
    } finally {
      requestAnimationFrame(() => { if (document.activeElement === document.body) buttonRef.current?.focus(); });
    }
  }
  async function restore() {
    if (!undo) return;
    setFailure("");
    try {
      const result = await store.act({ type: "undo", ...undo });
      setUndo(null);
      setNotice(result.conflict ? "This removal changed in another tab. Nothing was overwritten." : "Page restored.");
      requestAnimationFrame(() => buttonRef.current?.focus());
    } catch (error) {
      setFailure(error instanceof SavedPagesError ? error.message : "This change couldn't be saved. Nothing was changed. Try again.");
      requestAnimationFrame(() => { if (document.activeElement === document.body) undoRef.current?.focus(); });
    }
  }
  return <div className="mt-4">
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <button ref={buttonRef} type="button" className="bc-btn bc-btn--quiet inline-flex items-center gap-2 disabled:opacity-60" aria-pressed={saved} disabled={state !== "ready" || pending} onClick={() => { void toggle(); }}><BookmarkIcon />{pending ? "Saving…" : saved ? "Saved" : "Save page"}</button>
      {saved && state === "ready" ? <Link href="/saved" prefetch={false} className="inline-flex min-h-11 items-center text-sm text-link underline underline-offset-4">View saved pages</Link> : null}
      {undo ? <button ref={undoRef} type="button" className="inline-flex min-h-11 items-center text-sm text-link underline underline-offset-4" disabled={state !== "ready" || pending} onClick={() => { void restore(); }}>Undo removal</button> : null}
    </div>
    <p className="m-0 mt-2 text-sm text-muted-foreground" role="status">{state === "loading" ? "Checking saved pages…" : notice}</p>
    {failure || error ? <div className="mt-2 text-sm" role="alert"><p className="m-0">{failure || error}</p>{state === "error" ? <button type="button" className="inline-flex min-h-11 items-center text-link underline" onClick={() => { void store.refresh(); }}>Try again</button> : null}</div> : null}
  </div>;
}
