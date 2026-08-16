import type { Topic } from "../types";

export const anxiety: Topic = {
  slug: "anxiety",
  title: "Anxiety",
  icon: "🕊️",
  summary:
    "Anxiety grows when your mind tries to carry outcomes alone. This reset helps you offload the weight to God and return to a guarded, steady mind.",
  tone: "peace",
  kind: "reset",
  graceGuardrail:
    "Peace is God's guard around the heart, not a prize for worrying well enough first.",
  stateChange: { from: "Anxious", to: "Calm" },
  resetName: "C.A.L.M.",
  framing:
    "This is a simple loop: name the weight, ask God, release what you cannot control, then take the next peaceful step.",
  why: "Anxiety tries to manage the future from the inside of your chest. Scripture invites you to present the request and let peace do the guarding.",
  steps: [
    {
      letter: "C",
      title: "Cast it",
      verse: "1 Peter 5:7",
      explanation: "Name the anxiety clearly, then hand it over. He cares for you.",
      action: "Name the anxiety in three to five words, then say: “I cast this onto You.”",
    },
    {
      letter: "A",
      title: "Ask",
      verse: "Philippians 4:6–7",
      explanation:
        "Prayer is presenting a request, not proving that you have already become calm.",
      action: "Write one sentence: “God, I’m asking for ___.”",
    },
    {
      letter: "L",
      title: "Let go",
      verse: "Philippians 4:6–7",
      explanation:
        "Release what you cannot control today. Circle the one thing you can do next.",
      action: "Write: “I release what I can’t control today.” Circle one next action.",
    },
    {
      letter: "M",
      title: "Move with peace",
      verse: "Philippians 4:6–7",
      explanation:
        "The peace of God guards heart and mind in Christ Jesus. Then take the next small step.",
      action: "Breathe in 4, out 6, twice. Ask: “What would peace do next?” Do that.",
    },
  ],
  whenToUse: [
    "Your thoughts are looping over an outcome you cannot force",
    "Your body is ahead of your mind — tight chest, restless hands",
    "You keep rehearsing conversations that have not happened",
  ],
  sixtySecond: [
    "Name the worry in a few words and cast it. (1 Peter 5:7)",
    "Ask God for one thing. (Philippians 4:6–7)",
    "Do the next peaceful action immediately.",
  ],
  prayer:
    "Father, I cannot carry this outcome alone. I cast it onto You because You care. Guard my heart and mind with peace, and show me the next faithful step. Amen.",
  scripture: [
    {
      ref: "Philippians 4:6–7",
      insight: "Peace is promised as a guard after the request is presented, not before.",
    },
    {
      ref: "1 Peter 5:7",
      insight: "Care is the reason you can transfer the weight.",
    },
  ],
  safetyNote:
    "Ongoing, intense anxiety that disrupts sleep, work, or safety is also a health signal. Seek appropriate professional care. Spiritual practice does not replace clinical support.",
  readNext: [
    { href: "/topics/fear", title: "Fear" },
    { href: "/topics/loneliness", title: "Loneliness" },
    { href: "/topics/jesus-and-the-gospel", title: "Jesus and the Gospel" },
  ],
};
