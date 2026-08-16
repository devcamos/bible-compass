import type { Topic } from "../types";

export const trust: Topic = {
  slug: "trust",
  title: "Trust",
  icon: "🤲",
  summary:
    "Trust is not pretending everything is fine. Trust is choosing God's direction when you cannot see the whole road.",
  tone: "peace",
  kind: "reset",
  graceGuardrail:
    "Trust is a response to God's character, not a way to earn a safer outcome.",
  stateChange: { from: "Uncertainty", to: "Trust" },
  resetName: "P.A.T.H.",
  framing:
    "This is a short reset to move from overthinking toward steady steps.",
  why: "When outcomes feel unclear, the mind tries to regain control by running scenarios. Scripture calls you to trust God's wisdom above your own understanding.",
  steps: [
    {
      letter: "P",
      title: "Pause and place your trust",
      verse: "Psalm 56:3",
      explanation: "You do not need to solve everything to choose trust. When you are afraid, put your trust in God.",
      action: "Breathe in 4, out 6, twice. Say: “I put my trust in You.”",
    },
    {
      letter: "A",
      title: "Acknowledge what you cannot control",
      verse: "Proverbs 3:5",
      explanation: "Anxiety grows when you lean on limited understanding.",
      action: "Write: “I don’t know ___.” Then: “I trust You with it.”",
    },
    {
      letter: "T",
      title: "Take the next right step",
      verse: "Proverbs 3:6",
      explanation: "Trust is not passive. In all your ways acknowledge Him, and He will make straight your paths.",
      action: "Write: “My next step is ___.” Keep it small.",
    },
    {
      letter: "H",
      title: "Hold to a promise",
      verse: "Isaiah 26:3",
      explanation: "Peace grows when your mind stays on one truth, because you trust Him.",
      action: "Repeat: “My path is straightened by God.”",
    },
  ],
  whenToUse: [
    "You are waiting for news",
    "You are tempted to overthink a decision",
    "You feel fear about the future",
    "You are stuck because you want certainty first",
  ],
  sixtySecond: [
    "Breathe in 4, out 6, twice.",
    "Say: “I put my trust in You.” (Psalm 56:3)",
    "Ask: “What is my next step?” (Proverbs 3:6)",
    "Do it for two minutes.",
  ],
  prayer:
    "Lord, I do not want to lean on my own understanding. I acknowledge You in this. Make my path straight. Keep my mind steady in peace. Amen.",
  scripture: [
    { ref: "Psalm 56:3", insight: "Fear is a moment to place trust, not to hide it." },
    { ref: "Proverbs 3:5–6", insight: "Straight paths follow acknowledged dependence." },
  ],
  readNext: [
    { href: "/topics/faith", title: "Faith" },
    { href: "/topics/fear", title: "Fear" },
    { href: "/topics/jesus-and-the-gospel", title: "Jesus and the Gospel" },
  ],
};
