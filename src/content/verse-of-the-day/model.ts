import type { VerseOfTheDayEntry } from "./types";

export type VerseOfTheDayDraft = {
  reference: string;
  text: string;
  topicSlug: string;
  translation?: string;
};

const DEFAULT_TRANSLATION = "NIV";

/** Normalized verse-of-the-day row passed into UI and rotation logic. */
export class VerseOfTheDay implements VerseOfTheDayEntry {
  readonly reference: string;
  readonly translation: string;
  readonly text: string;
  readonly topicSlug?: string;

  private constructor(entry: VerseOfTheDayEntry) {
    this.reference = entry.reference;
    this.translation = entry.translation;
    this.text = entry.text;
    this.topicSlug = entry.topicSlug;
  }

  static fromDraft(draft: VerseOfTheDayDraft): VerseOfTheDay {
    return new VerseOfTheDay({
      reference: draft.reference,
      translation: draft.translation ?? DEFAULT_TRANSLATION,
      text: draft.text,
      topicSlug: draft.topicSlug,
    });
  }
}
