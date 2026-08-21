import type { Topic } from "../types";

export const componentsOfTheBible: Topic = {
  slug: "components-of-the-bible",
  title: "Components of the Bible",
  icon: "🧩",
  summary:
    "The Bible is like a big library. Lots of books sit on two shelves — and together they tell one story about God.",
  tone: "bible",
  kind: "foundation",
  graceGuardrail:
    "Learning the map of the Bible helps you find your way. It is not a quiz you must pass before God loves you.",
  framing:
    "You do not need to know every book name today. Start with the big picture: two shelves, one story, Jesus at the centre.",
  why: "When you know how the library is arranged, opening the Bible feels less scary — and you can find the next good page to read.",
  sections: [
    {
      heading: "Picture a library",
      paragraphs: [
        "A library has many books, but they still belong in one building.",
        "The Bible works like that. Many books. One big story. God is the Author who stays with His people.",
      ],
    },
    {
      heading: "Two big shelves",
      paragraphs: [
        "Think of two shelves side by side. The first shelf looks forward to Jesus. The second shelf shows Jesus and what comes next.",
      ],
      bullets: [
        "Old Testament — stories, songs, and promises from before Jesus was born",
        "New Testament — Jesus' life, the first churches, and hope for the end of the story",
      ],
    },
    {
      heading: "Old Testament — what sits on that shelf",
      paragraphs: [
        "These books tell how God made the world, chose a family, rescued them, and kept promising a Saviour.",
      ],
      bullets: [
        "Law — beginnings and God's good ways (Genesis to Deuteronomy)",
        "History — real people making real choices with God",
        "Wisdom and poetry — songs, prayers, and wise words for everyday life",
        "Major prophets — longer books that call people back to God",
        "Minor prophets — shorter books with the same kind of message",
      ],
    },
    {
      heading: "New Testament — what sits on that shelf",
      paragraphs: [
        "These books show Jesus arriving, dying, rising, and sending His friends to share the good news.",
      ],
      bullets: [
        "Gospels — four books about Jesus' life, death, and rising again",
        "Acts — how the good news spread and the first churches began",
        "Letters (epistles) — notes to churches and friends about living with Jesus",
        "Revelation — a hope-filled ending that uses big picture language",
      ],
    },
    {
      heading: "How the pieces fit",
      paragraphs: [
        "Every shelf points to the same centre: Jesus.",
        "The Old Testament gets you ready. The New Testament shows the promise kept. You can open any part and still ask, “What does this show me about God?”",
      ],
    },
  ],
  sixtySecond: [
    "Say the two shelves out loud: Old Testament, New Testament.",
    "Pick one shelf. Name one kind of book on it (for example: Gospels, or songs).",
    "Thank God that the whole library tells one story with Jesus at the centre.",
  ],
  prayer:
    "Father, thank You for this big library of books. Help me see how the parts fit, and help me meet Jesus in the story. Amen.",
  readNext: [
    { href: "/topics/how-to-read-the-bible", title: "How to read the Bible" },
    { href: "/topics/bible-timeline", title: "Bible timeline" },
    { href: "/topics/books-described", title: "Books described" },
  ],
};
