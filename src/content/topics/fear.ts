import type { Topic } from "../types";

export const fear: Topic = {
  slug: "fear",
  title: "Fear",
  icon: "🕊️",
  summary:
    "Fear does not always look dramatic. Sometimes it is a tight chest, racing thoughts, and the feeling that something is about to go wrong.",
  tone: "peace",
  kind: "reset",
  graceGuardrail:
    "Peace is not a reward for controlling every outcome. God is with you before the solution arrives.",
  stateChange: { from: "Overwhelmed", to: "Steady" },
  resetName: "W.I.T.H.",
  framing:
    "This is a short reset you can use to move from overwhelmed toward steady, and from uncertainty toward trust, in a few minutes.",
  why: "Fear is your mind trying to protect you by imagining outcomes you cannot control. Under pressure, thoughts speed up, the body reacts, and attention shrinks to worst-case scenarios. Presence comes before solutions.",
  steps: [
    {
      letter: "W",
      title: "God is with me",
      verse: "Isaiah 41:10",
      explanation:
        "You are not facing this alone. Presence comes before solutions.",
      action: "Put one hand on your chest and say slowly: “I am not alone. God is with me.”",
    },
    {
      letter: "I",
      title: "Choose courage for the next step",
      verse: "Joshua 1:9",
      explanation:
        "Courage is not the absence of fear. It is movement while fear is still present.",
      action: "Write one sentence: “My next step is ___.” Keep it small.",
    },
    {
      letter: "T",
      title: "Trade anxious thoughts for peace",
      verse: "Philippians 4:6–7",
      explanation:
        "Peace enters when you release what you cannot carry alone. You do not earn a calm mind; you ask for a guarded one.",
      action: "List three worries. Next to each, write “I release this.”",
    },
    {
      letter: "H",
      title: "Hold my mind steady",
      verse: "Isaiah 26:3",
      explanation:
        "Fear grows when the mind runs everywhere. Peace grows when you hold one truth.",
      action: "Repeat one phrase ten times: “God is with me.” Then do the next small step.",
    },
  ],
  whenToUse: [
    "It is late and your mind will not stop",
    "You are about to make a decision and feel frozen",
    "Stress hits suddenly at work",
    "You are waiting for news",
    "Fear of the future arrives first thing in the morning",
  ],
  sixtySecond: [
    "Breathe in for 4, out for 6, twice.",
    "Say: “God is with me.” (Isaiah 41:10)",
    "Ask: “What is my next step?” (Joshua 1:9)",
    "Do that one small action immediately.",
  ],
  prayer:
    "Lord, fear is loud right now. Help me feel Your presence. Guard my mind with peace. Give me courage for the next step. Amen.",
  scripture: [
    {
      ref: "Isaiah 41:10",
      insight: "God's strengthening grip holds when yours cannot.",
    },
    {
      ref: "2 Timothy 1:7",
      insight: "A sound mind is a gift, not a personality trait you must manufacture.",
    },
  ],
  readNext: [
    { href: "/topics/anxiety", title: "Anxiety" },
    { href: "/topics/courage", title: "Courage" },
    { href: "/topics/jesus-and-the-gospel", title: "Jesus and the Gospel" },
  ],
};
