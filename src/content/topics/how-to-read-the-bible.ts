import type { Topic } from "../types";

export const howToReadTheBible: Topic = {
  slug: "how-to-read-the-bible",
  title: "How to read the Bible",
  icon: "🧭",
  summary:
    "A simple guide for reading with context, clarity, and application — without using Scripture as a ladder to earn God.",
  tone: "bible",
  kind: "foundation",
  graceGuardrail:
    "You read because God has already spoken. Understanding is a gift to receive, not a performance to prove.",
  framing:
    "Read verses in paragraphs, not in isolation. Ask who is speaking, to whom, and why. Keep Jesus at the centre.",
  sections: [
    {
      heading: "A simple method",
      paragraphs: ["Three movements keep a passage honest:"],
      bullets: [
        "Observation: What does the passage say?",
        "Interpretation: What did it mean to the original audience?",
        "Application: What should change in my thinking, character, or actions — as a response to grace?",
      ],
    },
    {
      heading: "Genre quick guide",
      paragraphs: ["Different kinds of writing ask to be read differently:"],
      bullets: [
        "Law: reveals God's holiness and how life with God is meant to look.",
        "History / narrative: shows God at work through real people and choices.",
        "Wisdom / poetry: shapes character and worship; often uses imagery.",
        "Prophets: call people back to covenant faithfulness; include warning and hope.",
        "Gospels: Jesus' life, teachings, death, and resurrection.",
        "Letters: how to live out the gospel in everyday life.",
        "Apocalyptic: symbolic language of spiritual reality, judgment, and hope.",
      ],
    },
    {
      heading: "Guardrails",
      paragraphs: ["Keep these nearby whenever you open a verse:"],
      bullets: [
        "Read verses in paragraphs, not in isolation.",
        "Ask: Who is speaking? To whom? Why?",
        "Watch repeated words, contrasts, and commands.",
        "Write a short “What this teaches about God” sentence every time.",
        "Ask how the passage connects to Jesus and the gospel.",
      ],
    },
  ],
  prayer:
    "Lord, give me understanding and a willing heart to obey what You show me. Amen.",
  readNext: [
    { href: "/topics/jesus-and-the-gospel", title: "Jesus and the Gospel" },
    { href: "/topics/bible-timeline", title: "Bible timeline" },
    { href: "/topics/components-of-the-bible", title: "Components of the Bible" },
  ],
};
