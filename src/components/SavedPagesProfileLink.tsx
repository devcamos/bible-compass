"use client";

import Link from "next/link";
import { BookmarkIcon } from "./SavedPageActions";
import { useSavedPages } from "./SavedPagesProvider";

export function SavedPagesProfileLink({ onOpen }: { onOpen: () => void }) {
  const { state, entries } = useSavedPages();
  return <Link href="/saved" prefetch={false} onNavigate={onOpen} className="bc-saved-surface block rounded-2xl border border-border bg-card p-4 text-foreground no-underline hover:border-copper">
    <span className="flex items-center gap-3"><BookmarkIcon /><span className="font-medium">Saved pages</span><span className="ml-auto text-sm text-muted-foreground">{state === "ready" ? entries.length : state === "loading" ? "Loading…" : "Unavailable"}</span><span aria-hidden="true">→</span></span>
    <span className="mt-1 block text-sm text-muted-foreground">Return to your readings, on this device.</span>
  </Link>;
}
