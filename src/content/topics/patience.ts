import type { Topic } from "../types";

export const patience: Topic = {
  slug: "patience",
  title: "Patience",
  icon: "🕊️",
  summary:
    "Patience is not doing nothing. Patience is staying faithful while time does its work.",
  tone: "faith",
  kind: "reset",
  graceGuardrail:
    "Steadfastness is formed in you; it is not a test you must pass before God will love you.",
  stateChange: { from: "Pressure", to: "Patience" },
  resetName: "S.T.A.Y.",
  framing: "This is a short reset to move from frustration toward steadiness.",
  why: "When life is hard, the mind wants immediate relief. Scripture teaches that testing produces steadfastness. Patience is how you stay whole while God grows you.",
  steps: [
    {
      letter: "S",
      title: "Stay under the process",
      verse: "James 1:2–4",
      explanation: "The testing of your faith produces steadfastness, that you may be complete.",
      action: "Name the pressure in one sentence. Say: “This is producing steadfastness in me.”",
    },
    {
      letter: "T",
      title: "Thank God in advance",
      verse: "Romans 12:12",
      explanation: "Rejoice in hope, even before the outcome arrives.",
      action: "Write three things you still have.",
    },
    {
      letter: "A",
      title: "Ask for strength",
      verse: "Romans 12:12",
      explanation: "Be constant in prayer. Endurance is requested, not manufactured alone.",
      action: "Pray: “Lord, strengthen me to endure.”",
    },
    {
      letter: "Y",
      title: "Yield the timeline",
      verse: "Psalm 27:14",
      explanation: "Wait for the Lord; be strong, and let your heart take courage.",
      action: "Write: “I release my timeline.” Choose one small faithful action today.",
    },
  ],
  whenToUse: [
    "Progress feels slow",
    "You are tempted to quit",
    "You are waiting for an outcome",
    "You feel irritated by delays",
  ],
  sixtySecond: [
    "Say: “Steadfastness is being built in me.” (James 1:2–4)",
    "Pray: “Strengthen me.” (Romans 12:12)",
    "Take one small faithful action.",
  ],
  prayer:
    "Lord, help me endure without bitterness. Give me hope. Make me steady. Amen.",
  scripture: [
    { ref: "James 1:2–4", insight: "Testing aims at completeness, not humiliation." },
    { ref: "Psalm 27:14", insight: "Waiting is courageous, not empty." },
  ],
  readNext: [
    { href: "/topics/diligence", title: "Diligence" },
    { href: "/topics/faith", title: "Faith" },
    { href: "/topics/jesus-and-the-gospel", title: "Jesus and the Gospel" },
  ],
};
