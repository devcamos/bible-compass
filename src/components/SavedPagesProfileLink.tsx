"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { BookmarkIcon } from "./SavedPageActions";
import { useSavedPages } from "./SavedPagesProvider";

export function SavedPagesProfileLink({ onOpen }: { onOpen: () => void }) {
  const { state, entries } = useSavedPages();
  const pathname = usePathname();
  const focusRequested = useRef(false);
  const focusFrame = useRef<number | null>(null);
  useEffect(() => {
    if (pathname === "/saved" && focusRequested.current) {
      focusRequested.current = false;
      document.getElementById("saved-pages-heading")?.focus();
    }
  }, [pathname]);
  useEffect(() => () => { if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current); }, []);
  return <Link href="/saved#saved-pages-heading" prefetch={false} onNavigate={() => {
    focusRequested.current = true;
    onOpen();
    // The router scrolls hash targets without moving focus. On this route the
    // heading is already mounted; other routes transfer focus after commit.
    if (pathname === "/saved") {
      focusFrame.current = requestAnimationFrame(() => {
        focusRequested.current = false;
        document.getElementById("saved-pages-heading")?.focus();
      });
    }
  }} className="bc-saved-surface block rounded-2xl border border-border bg-card p-4 text-foreground no-underline hover:border-copper">
    <span className="flex items-center gap-3"><BookmarkIcon /><span className="font-medium">Saved pages</span><span className="ml-auto text-sm text-muted-foreground">{state === "ready" ? entries.length : state === "loading" ? "Loading…" : "Unavailable"}</span><span aria-hidden="true">→</span></span>
    <span className="mt-1 block text-sm text-muted-foreground">Return to your readings, on this device.</span>
  </Link>;
}
