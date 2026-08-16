import type { Topic } from "../types";

export const hardWork: Topic = {
  slug: "hard-work",
  title: "Hard work",
  icon: "🌱",
  summary:
    "Motivation is unreliable. Discipline is a decision you repeat. Work can become worship when God is the audience.",
  tone: "faith",
  kind: "reset",
  graceGuardrail:
    "Faithful work is a grateful response, not a way to earn God's approval. Christ has already accepted those who trust Him.",
  stateChange: { from: "Avoidance", to: "Effort" },
  resetName: "W.O.R.K.",
  framing:
    "This is a short reset to move from avoidance toward effort without turning work into a ladder toward God.",
  why: "When a task feels big, the mind looks for comfort and quick relief. Scripture redirects your work to God as the audience. That shift can turn ordinary effort into worship and give you strength to keep going.",
  steps: [
    {
      letter: "W",
      title: "Work for the Lord",
      verse: "Colossians 3:23",
      explanation:
        "Your true audience is God. This is vocation, not self-salvation.",
      action: "Say: “This work is for You.” Write: “Today I will work heartily on ___.”",
    },
    {
      letter: "O",
      title: "One task",
      verse: "Proverbs 14:23",
      explanation: "Toil counts when it is focused. Choose one profitable task.",
      action: "Write: “One task: ___.”",
    },
    {
      letter: "R",
      title: "Remove distraction",
      verse: "Hebrews 12:1",
      explanation:
        "Weights are not always sins. Often they are distractions that keep you from running.",
      action: "Remove one distraction — close a tab, silence a phone, clear a desk.",
    },
    {
      letter: "K",
      title: "Keep going",
      verse: "Galatians 6:9",
      explanation:
        "Consistency is the advantage. Do not grow weary of doing good.",
      action: "Set a ten-minute timer and work until it rings.",
    },
  ],
  whenToUse: [
    "You feel resistance before starting",
    "You are tempted to procrastinate",
    "You are working without focus",
    "You feel tired and want to quit early",
  ],
  sixtySecond: [
    "Say: “I work for the Lord.” (Colossians 3:23)",
    "Pick one task. (Proverbs 14:23)",
    "Start a two-minute timer and begin.",
  ],
  prayer:
    "Lord, help me work with all my heart. Give me focus and endurance. Let my effort be pleasing to You, not a way of proving myself. Amen.",
  scripture: [
    {
      ref: "Colossians 3:23–24",
      insight: "Hearty work is offered to the Lord, who already sees you.",
    },
    {
      ref: "Galatians 6:9",
      insight: "Endurance is fruit, not a wage God is waiting to calculate.",
    },
  ],
  readNext: [
    { href: "/topics/diligence", title: "Diligence" },
    { href: "/topics/courage", title: "Courage" },
    { href: "/topics/jesus-and-the-gospel", title: "Jesus and the Gospel" },
  ],
};
