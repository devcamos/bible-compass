import type { Topic } from "../types";

export const failure: Topic = {
  slug: "failure",
  title: "Failure",
  icon: "🧩",
  summary:
    "Failure is not the end. Failure is often the place God rebuilds you. Rise, do not hide.",
  tone: "courage",
  kind: "reset",
  graceGuardrail:
    "You do not climb out of failure to become acceptable. Grace is sufficient; power is made perfect in weakness.",
  stateChange: { from: "Shame", to: "Strength" },
  resetName: "R.I.S.E.",
  framing: "This is a reset to move from condemnation toward the next faithful step.",
  why: "After a mistake, the mind can spiral into quitting. Scripture shows a different pattern: the righteous fall and rise, and God's grace meets weakness.",
  steps: [
    {
      letter: "R",
      title: "Return to God — no hiding",
      verse: "Psalm 34:18",
      explanation: "The Lord is near to the brokenhearted.",
      action: "Say: “Lord, I’m here. I’m not hiding.”",
    },
    {
      letter: "I",
      title: "Identify the lesson",
      verse: "Proverbs 24:16",
      explanation: "The righteous falls seven times and rises again.",
      action: "Write what happened, then what you will do differently next time.",
    },
    {
      letter: "S",
      title: "Surrender weakness to grace",
      verse: "2 Corinthians 12:9",
      explanation: "My grace is sufficient for you, for my power is made perfect in weakness.",
      action: "Write: “I surrender this weakness: ___.”",
    },
    {
      letter: "E",
      title: "Execute the next step",
      verse: "Micah 7:8",
      explanation: "Though I fall, I will rise.",
      action: "Choose one repair action and start it for two minutes.",
    },
  ],
  whenToUse: [
    "You made a mistake",
    "You feel behind",
    "You feel discouraged",
    "You want to quit",
  ],
  sixtySecond: [
    "Say: “Grace meets me here.” (2 Corinthians 12:9)",
    "Ask: “What is one repair action?”",
    "Start now.",
  ],
  prayer:
    "Lord, thank You that Your grace is sufficient. Help me rise again. Turn this failure into wisdom. Amen.",
  scripture: [
    { ref: "2 Corinthians 12:9", insight: "Weakness is not a disqualifier; it is where grace shows." },
    { ref: "Proverbs 24:16", insight: "Rising again belongs to the story of the righteous." },
  ],
  readNext: [
    { href: "/topics/patience", title: "Patience" },
    { href: "/topics/jesus-and-the-gospel", title: "Jesus and the Gospel" },
    { href: "/topics/courage", title: "Courage" },
  ],
};
