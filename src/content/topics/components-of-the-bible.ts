import type { Topic } from "../types";

export const componentsOfTheBible: Topic = {
  slug: "components-of-the-bible",
  title: "Components of the Bible",
  icon: "🧩",
  summary:
    "How the library of Scripture is arranged — so you can find a book without losing the whole story.",
  tone: "bible",
  kind: "foundation",
  graceGuardrail:
    "Knowing the map of Scripture is a help for reading, not a score in Bible trivia before God.",
  framing:
    "The Bible is one story in two testaments, with several kinds of writing inside each.",
  sections: [
    {
      heading: "Old Testament",
      paragraphs: ["These books prepare the way for the Messiah and tell Israel's story with God."],
      bullets: [
        "Law (Books of Moses)",
        "History",
        "Wisdom and poetry",
        "Major prophets",
        "Minor prophets",
      ],
    },
    {
      heading: "New Testament",
      paragraphs: ["These books announce Jesus, form the church, and point to new creation."],
      bullets: [
        "Gospels",
        "History (Acts)",
        "Epistles (letters)",
        "Apocalyptic (Revelation)",
      ],
    },
  ],
  prayer:
    "Lord, help me see how the parts belong to one story centred on Jesus. Amen.",
  readNext: [
    { href: "/topics/how-to-read-the-bible", title: "How to read the Bible" },
    { href: "/topics/bible-timeline", title: "Bible timeline" },
    { href: "/topics/books-described", title: "Books described" },
  ],
};
