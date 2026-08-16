import type { Topic } from "../types";

export const peopleOfTheBible: Topic = {
  slug: "people-of-the-bible",
  title: "People of the Bible",
  icon: "🧑‍🤝‍🧑",
  summary:
    "A starter index of major lives in Scripture, with the books where their stories are told.",
  tone: "bible",
  kind: "foundation",
  graceGuardrail:
    "These lives reveal God's character. They are not a hall of fame you must match in order to be loved.",
  framing:
    "For each person, notice the time and setting, what their life highlights about God, and both the wisdom to repeat and the warning to avoid.",
  sections: [
    {
      heading: "Major people — starter list",
      paragraphs: ["Begin here, then read the surrounding books in a trusted translation:"],
      bullets: [
        "Abraham: Genesis 12–25",
        "Moses: Exodus–Deuteronomy",
        "Joshua: Joshua",
        "David: 1 Samuel, 2 Samuel, parts of 1 Chronicles",
        "Solomon: 1 Kings 1–11, 2 Chronicles 1–9",
        "Isaiah: Isaiah",
        "Jeremiah: Jeremiah",
        "Peter: Gospels, Acts, 1–2 Peter",
        "Paul: Acts 9, 13–28 and Paul's letters",
      ],
    },
    {
      heading: "How to study a life",
      paragraphs: ["Keep four notes:"],
      bullets: [
        "Context: time period and main setting",
        "What their life highlights about God's character",
        "Human patterns you recognize in yourself",
        "Warnings and wisdom: what to repeat and what to avoid",
      ],
    },
  ],
  prayer:
    "Lord, teach me from these lives without turning them into a scorecard. Show me Your character. Amen.",
  readNext: [
    { href: "/topics/motivational-men", title: "Motivational men" },
    { href: "/topics/motivational-women", title: "Motivational women" },
    { href: "/topics/jesus-and-the-gospel", title: "Jesus and the Gospel" },
  ],
};
