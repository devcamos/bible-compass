import type { Topic } from "../types";

export const prayerAndWorship: Topic = {
  slug: "prayer-and-worship",
  title: "Prayer and worship",
  icon: "🙏",
  summary:
    "Simple patterns for talking with God: honesty, remembrance, trust — not a performance to get His attention.",
  tone: "faith",
  kind: "foundation",
  graceGuardrail:
    "Prayer is incoming to a Father who already knows. You do not pray well enough to be heard; you are heard in Christ.",
  framing:
    "Use a pattern when words are thin. Then read a prayer already in Scripture and let it teach your own.",
  sections: [
    {
      heading: "Prayer patterns",
      paragraphs: ["Two simple shapes:"],
      bullets: [
        "ACTS: Adoration, Confession, Thanksgiving, Supplication",
        "Psalm pattern: honesty, then remembrance, then trust",
      ],
    },
    {
      heading: "Prayers to study",
      paragraphs: ["Read these in their chapters, not as isolated lines:"],
      bullets: [
        "Jesus' model prayer: Matthew 6:9–13",
        "Paul's prayers: Ephesians 1:15–23; Ephesians 3:14–21",
        "Psalms 23, 27, 51, 91, 103",
      ],
    },
    {
      heading: "A simple prayer template",
      paragraphs: ["Fill these slowly:"],
      bullets: [
        "Lord, You are…",
        "I confess…",
        "Thank You for…",
        "Please help me…",
        "Today I will obey by…",
      ],
    },
  ],
  prayer:
    "Father, You are near. I bring You honesty, thanks, and need. Teach me to pray as a child, not as a performer. Amen.",
  readNext: [
    { href: "/topics/character-of-god", title: "Character of God" },
    { href: "/topics/loneliness", title: "Loneliness" },
    { href: "/topics/jesus-and-the-gospel", title: "Jesus and the Gospel" },
  ],
};
