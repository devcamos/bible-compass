import { VerseOfTheDay, type VerseOfTheDayDraft } from "./model";
import type { VerseOfTheDayEntry } from "./types";
import verseDb from "./verse-db.json";

/**
 * Curated rotation list (imported editorial source — not fetched at runtime).
 * Indexed by UTC calendar day from the anchor in `getVerseOfTheDay`.
 */
export const verseOfTheDayList: VerseOfTheDayEntry[] = (verseDb as VerseOfTheDayDraft[]).map(
  (draft) => VerseOfTheDay.fromDraft(draft),
);
