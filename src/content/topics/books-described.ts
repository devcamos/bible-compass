import type { Topic } from "../types";

export const booksDescribed: Topic = {
  slug: "books-described",
  title: "Books described",
  icon: "🗂️",
  summary:
    "Starter notes on who wrote which books, and where to read those lives in Scripture.",
  tone: "bible",
  kind: "foundation",
  graceGuardrail:
    "Authorship notes help you read in context. They are not a credential you need before God will speak.",
  framing:
    "The editorial library still has fuller book-by-book overviews to grow. This path keeps the public notes that are ready.",
  sections: [
    {
      heading: "Notes ready for readers",
      paragraphs: ["A few traditional attributions worth holding loosely and checking in a trusted study Bible:"],
      bullets: [
        "Solomon is associated with Proverbs, and Ecclesiastes is traditionally associated with him.",
        "Psalms is primarily associated with David, with other contributors.",
        "Isaiah is written by the prophet Isaiah.",
        "Jeremiah is written by the prophet Jeremiah.",
        "Matthew, Mark, Luke, and John bear the names of their traditional authors.",
        "Many of Paul's letters — for example Romans, Corinthians, and Galatians — are written by Paul.",
      ],
    },
    {
      heading: "Where to study the lives of these authors",
      paragraphs: ["Read the lives in place, not only the later letters:"],
      bullets: [
        "David: 1 Samuel, 2 Samuel, and parts of 1 Chronicles",
        "Solomon: 1 Kings 1–11 and 2 Chronicles 1–9",
        "Isaiah: Isaiah, especially chapters 6–8",
        "Jeremiah: Jeremiah",
        "Gospel authors: their gospels and Acts",
        "Paul: Acts 9, 13–28 and Paul's epistles",
      ],
    },
  ],
  prayer:
    "Lord, help me read each book as part of Your story, not as a disconnected quote. Amen.",
  readNext: [
    { href: "/topics/people-of-the-bible", title: "People of the Bible" },
    { href: "/topics/components-of-the-bible", title: "Components of the Bible" },
    { href: "/topics/how-to-read-the-bible", title: "How to read the Bible" },
  ],
};
