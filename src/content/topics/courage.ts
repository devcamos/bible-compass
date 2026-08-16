import type { Topic } from "../types";

export const courage: Topic = {
  slug: "courage",
  title: "Courage",
  icon: "🛡️",
  summary:
    "Courage rarely shows up as a big moment. It is usually one small act of obedience while your body still feels fear.",
  tone: "courage",
  kind: "reset",
  graceGuardrail:
    "Courage is a response to God's presence, not a test you must pass before He will help you.",
  stateChange: { from: "Hesitation", to: "Action" },
  resetName: "B.O.L.D.",
  framing:
    "This is a fast system to move from hesitation toward action without waiting until you feel ready.",
  why: "Fear tries to keep you safe by making risk feel larger than obedience. Courage is built by taking the next step with God, not by waiting for certainty.",
  steps: [
    {
      letter: "B",
      title: "Be strong",
      verse: "Joshua 1:9",
      explanation:
        "Your strength is not only willpower. It is presence and support.",
      action: "Stand or straighten your posture. Say: “God is with me. I can be strong for the next step.”",
    },
    {
      letter: "O",
      title: "Obey the next right step",
      verse: "James 1:22",
      explanation:
        "Courage becomes real when it turns into action. Keep the step small and specific.",
      action: "Write: “The obedient next step is ___.”",
    },
    {
      letter: "L",
      title: "Let love drive, not fear",
      verse: "1 John 4:18",
      explanation:
        "Fear asks, “What if it costs me?” Love asks, “Who can I bless?” Perfect love casts out fear.",
      action: "Ask: “If I acted from love, what would I do?” Write one sentence.",
    },
    {
      letter: "D",
      title: "Discipline — a sound mind",
      verse: "2 Timothy 1:7",
      explanation:
        "God has not given a spirit of fear, but of power, love, and self-control. Discipline carries courage when feelings fluctuate.",
      action: "Set a ten-minute timer and begin the next step.",
    },
  ],
  whenToUse: [
    "You are procrastinating because a task feels intimidating",
    "You need to have a hard conversation",
    "You feel like you will fail, so you avoid starting",
    "You are waiting to feel confident before moving",
  ],
  sixtySecond: [
    "Straighten your posture and breathe in 4, out 6, twice.",
    "Say: “Be strong. God is with me.” (Joshua 1:9)",
    "Ask: “What is the obedient next step?” (James 1:22)",
    "Start it for two minutes.",
  ],
  prayer:
    "Lord, give me strength for the next step. Help me obey quickly. Let love cast out fear. Give me a sound mind. Amen.",
  scripture: [
    {
      ref: "Joshua 1:9",
      insight: "Presence travels with you; courage does not wait for a different room.",
    },
    {
      ref: "1 John 4:18",
      insight: "Love is the stronger motive — not self-display.",
    },
  ],
  readNext: [
    { href: "/topics/fear", title: "Fear" },
    { href: "/topics/hard-work", title: "Hard work" },
    { href: "/topics/jesus-and-the-gospel", title: "Jesus and the Gospel" },
  ],
};
