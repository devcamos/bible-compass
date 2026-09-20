import { verseOfTheDayList } from "@/content/verse-of-the-day/verses";
import type { VerseOfTheDayEntry } from "@/content/verse-of-the-day/types";

const MS_PER_DAY = 86_400_000;

/** First day of the public rotation (UTC midnight). */
const ROTATION_EPOCH_UTC = Date.UTC(2026, 0, 1);

export function getUtcDayIndex(date: Date = new Date()): number {
  const utcMidnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((utcMidnight - ROTATION_EPOCH_UTC) / MS_PER_DAY);
}

export function getVerseOfTheDay(date: Date = new Date()): VerseOfTheDayEntry {
  const list = verseOfTheDayList;
  const index = ((getUtcDayIndex(date) % list.length) + list.length) % list.length;
  return list[index]!;
}

/** Seconds until the next UTC calendar day (for cache headers / revalidate hints). */
export function secondsUntilNextUtcDay(date: Date = new Date()): number {
  const nextUtcMidnight = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + 1,
  );
  return Math.max(1, Math.ceil((nextUtcMidnight - date.getTime()) / 1000));
}
