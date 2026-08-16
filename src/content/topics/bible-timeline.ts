import type { Topic } from "../types";

export const bibleTimeline: Topic = {
  slug: "bible-timeline",
  title: "Bible timeline",
  icon: "🗓️",
  summary:
    "The big story arc of Scripture — creation, fall, promise, rescue, kingdom, exile, Messiah, church, and new creation.",
  tone: "bible",
  kind: "foundation",
  graceGuardrail:
    "The story moves toward restoration because God is faithful, not because humanity climbed high enough.",
  framing:
    "Hold the whole arc before you drill into one verse. Covenants help you see what God committed to do.",
  sections: [
    {
      heading: "The big story arc",
      paragraphs: ["A simple line through the library:"],
      bullets: [
        "Creation (Genesis 1–2)",
        "Fall (Genesis 3)",
        "Promise (Genesis 12 onward)",
        "Rescue (Exodus)",
        "Kingdom (David and the kings)",
        "Exile and return (Kings, Chronicles, Ezra/Nehemiah)",
        "Messiah (Gospels)",
        "Church (Acts and letters)",
        "New creation (Revelation)",
      ],
    },
    {
      heading: "Key covenants",
      paragraphs: ["Quick reference for what God committed to do:"],
      bullets: [
        "Noah: preservation of the world",
        "Abraham: blessing to the nations",
        "Moses (Sinai): law and national identity",
        "David: kingly line and kingdom hope",
        "New Covenant: forgiveness and a new heart through Christ",
      ],
    },
  ],
  prayer:
    "Lord of the whole story, help me read this passage inside Your promise, not as a scrap. Amen.",
  readNext: [
    { href: "/topics/jesus-and-the-gospel", title: "Jesus and the Gospel" },
    { href: "/topics/destiny-of-the-world", title: "The destiny of the world" },
    { href: "/topics/how-to-read-the-bible", title: "How to read the Bible" },
  ],
};
