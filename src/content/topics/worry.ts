import type { Topic } from "../types";

export const worry: Topic = {
  slug: "worry",
  title: "Worry",
  icon: "🕊️",
  summary:
    "Worry borrows tomorrow's trouble and spends today's strength on it. This reset helps you hand tomorrow back to the Father and live inside today.",
  tone: "peace",
  kind: "reset",
  graceGuardrail:
    "The Father's care does not switch on when you finally stop worrying. He feeds the birds before they ask; His care for you is already settled.",
  stateChange: { from: "Worried", to: "Resting" },
  resetName: "R.E.S.T.",
  framing:
    "This is a short loop from the Sermon on the Mount: notice the loop, entrust it to the Father, seek first what matters, then live in today only.",
  why: "Worry rehearses futures you cannot reach yet. Jesus does not shame the worrier; He points at the birds and the lilies and says your Father already knows what you need.",
  steps: [
    {
      letter: "R",
      title: "Recognise the loop",
      verse: "Matthew 6:27",
      explanation:
        "Worrying cannot add a single hour to your life. Naming the loop breaks its disguise as usefulness.",
      action: "Finish this sentence on paper: “Right now I am worrying about ___.”",
    },
    {
      letter: "E",
      title: "Entrust it to the Father",
      verse: "Matthew 6:31–32",
      explanation:
        "Your heavenly Father knows what you need before you list it. Trust is transferring the account, not deleting the need.",
      action: "Say: “Father, You already know I need ___. I hand it to You.”",
    },
    {
      letter: "S",
      title: "Seek first the kingdom",
      verse: "Matthew 6:33",
      explanation:
        "Worry shrinks your attention to survival. Seeking first re-widens it to what God is doing, and the rest is added, not earned.",
      action: "Ask: “What is one faithful thing I can do in the next hour?” Write it down.",
    },
    {
      letter: "T",
      title: "Take today only",
      verse: "Matthew 6:34",
      explanation:
        "Tomorrow will worry about itself. Today has enough trouble — and enough grace — of its own.",
      action: "Close the loop: “Today's portion is ___. Tomorrow is not mine to carry yet.” Then do today's step.",
    },
  ],
  whenToUse: [
    "You keep rehearsing next week while today sits unfinished",
    "A small uncertainty has grown into a running background hum",
    "You are planning for outcomes no plan can actually control",
    "You wake up already carrying tomorrow",
  ],
  sixtySecond: [
    "Name what you are worrying about in a few words. (Matthew 6:27)",
    "Say: “Father, You already know.” (Matthew 6:31–32)",
    "Do one faithful thing that belongs to today. (Matthew 6:33–34)",
  ],
  prayer:
    "Father, You feed the birds and clothe the lilies, and You know what I need before I ask. I hand tomorrow back to You. Teach me to seek Your kingdom first and to live inside today. Amen.",
  scripture: [
    {
      ref: "Matthew 6:25–34",
      insight: "Jesus grounds freedom from worry in the Father's existing care, not in better self-management.",
    },
    {
      ref: "1 Peter 5:7",
      insight: "Casting the care works because He cares for you — the transfer rests on His character.",
    },
  ],
  safetyNote:
    "Constant worry that disrupts sleep, appetite, or daily life is also a health signal. Seek appropriate professional care. Spiritual practice does not replace clinical support.",
  readNext: [
    { href: "/topics/peace", title: "Peace" },
    { href: "/topics/anxiety", title: "Anxiety" },
    { href: "/topics/letting-go", title: "Letting go" },
  ],
};
