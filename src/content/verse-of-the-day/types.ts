export type VerseOfTheDayEntry = {
  reference: string;
  translation: string;
  text: string;
  /** Optional Compass topic for “explore further”. */
  topicSlug?: string;
};
