"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { BookmarkIcon } from "./SavedPageActions";
import { useSavedPages } from "./SavedPagesProvider";

export function SavedPagesProfileLink({ onOpen }: { onOpen: () => void }) {
  const { state, entries } = useSavedPages();
  const focusFrame = useRef<number | null>(null);
  useEffect(() => () => { if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current); }, []);
  return <Link href="/saved#saved-pages-heading" prefetch={false} onNavigate={() => {
    onOpen();
    // An already mounted destination needs no route effect to run again.
    // A streamed destination transfers focus when its list actually mounts.
    if (document.getElementById("saved-pages-heading")) {
      if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
      focusFrame.current = requestAnimationFrame(() => {
        document.getElementById("saved-pages-heading")?.focus();
      });
    }
  }} className="bc-saved-surface block rounded-2xl border border-border bg-card p-4 text-foreground no-underline hover:border-copper">
    <span className="flex items-center gap-3"><BookmarkIcon /><span className="font-medium">Saved pages</span><span className="ml-auto text-sm text-muted-foreground">{state === "ready" ? entries.length : state === "loading" ? "Loading…" : "Unavailable"}</span><span aria-hidden="true">→</span></span>
    <span className="mt-1 block text-sm text-muted-foreground">Return to your readings, on this device.</span>
  </Link>;
}
