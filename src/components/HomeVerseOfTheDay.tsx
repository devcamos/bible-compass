"use client";

import { useSyncExternalStore } from "react";
import { VerseOfTheDay } from "@/components/VerseOfTheDay";
import { getVerseOfTheDay, parseVerseDate } from "@/lib/verse-of-the-day";
import type { VerseOfTheDayEntry } from "@/content/verse-of-the-day/types";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

function requestedDay(): string {
  const requested = parseVerseDate(new URLSearchParams(window.location.search).get("verse"));
  return (requested ?? new Date()).toISOString().slice(0, 10);
}

/** Preserve static home rendering while notification links select their verse. */
export function HomeVerseOfTheDay({ verse }: Readonly<{ verse: VerseOfTheDayEntry }>) {
  const day = useSyncExternalStore(subscribe, requestedDay, () => "");
  return <VerseOfTheDay verse={day ? getVerseOfTheDay(new Date(`${day}T00:00:00Z`)) : verse} />;
}
