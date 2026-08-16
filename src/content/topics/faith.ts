import type { Topic } from "../types";

export const faith: Topic = {
  slug: "faith",
  title: "Faith",
  icon: "✝️",
  summary:
    "Faith is not denial. Faith is movement with God when you cannot see the full picture.",
  tone: "faith",
  kind: "reset",
  graceGuardrail:
    "Faith receives God's faithfulness. It is not a feeling you must produce before He will help you.",
  stateChange: { from: "Unseen", to: "Steady" },
  resetName: "F.A.I.T.H.",
  framing: "This is a short reset to move from doubt toward obedient steps.",
  why: "When you cannot see results yet, the mind looks for proof before action. Faith grows through hearing God's Word and taking one step at a time.",
  steps: [
    {
      letter: "F",
      title: "Fix your focus on God's character",
      verse: "Proverbs 3:5",
      explanation: "Trust the Lord with all your heart, and do not lean on your own understanding.",
      action: "Say: “I trust Your character, not my understanding.”",
    },
    {
      letter: "A",
      title: "Affirm what faith is",
      verse: "Hebrews 11:1",
      explanation: "Faith is assurance of things hoped for, the conviction of things not seen.",
      action: "Write: “I am trusting You for ___.”",
    },
    {
      letter: "I",
      title: "Invite faith to grow through the Word",
      verse: "Romans 10:17",
      explanation: "Faith comes from hearing the word of Christ.",
      action: "Read one verse out loud and carry one phrase today.",
    },
    {
      letter: "T",
      title: "Take the next step, not by sight",
      verse: "2 Corinthians 5:7",
      explanation: "We walk by faith, not by sight.",
      action: "Write: “My next step is ___.” Start small.",
    },
    {
      letter: "H",
      title: "Hand God your honest struggle",
      verse: "Mark 9:24",
      explanation: "Honest faith can say both “I believe” and “help my unbelief.”",
      action: "Pray: “I believe; help my unbelief.”",
    },
  ],
  whenToUse: [
    "You cannot see the outcome yet",
    "You feel tempted to stall until you feel confident",
    "You are discouraged by slow progress",
    "You need courage to obey",
  ],
  sixtySecond: [
    "Say: “I walk by faith, not by sight.” (2 Corinthians 5:7)",
    "Ask: “What is the next step?”",
    "Start it for two minutes.",
  ],
  prayer:
    "Lord, I trust You even when I cannot see. Grow my faith through Your Word. Help me obey the next step. Amen.",
  scripture: [
    { ref: "Hebrews 11:1", insight: "Faith looks to God, not to visible proof first." },
    { ref: "Mark 9:24", insight: "Honesty about unbelief is still a way of coming to Jesus." },
  ],
  readNext: [
    { href: "/topics/trust", title: "Trust" },
    { href: "/topics/jesus-and-the-gospel", title: "Jesus and the Gospel" },
    { href: "/topics/hard-work", title: "Hard work" },
  ],
};
