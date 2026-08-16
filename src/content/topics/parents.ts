import type { Topic } from "../types";

export const parents: Topic = {
  slug: "parents",
  title: "Parents",
  icon: "🏠",
  summary:
    "Parenting is leadership. It is love with structure. The goal is formation, not control.",
  tone: "faith",
  kind: "reset",
  graceGuardrail:
    "Parents do not earn God's favour by a quiet house. Bring children up in the Lord's instruction without provoking them.",
  stateChange: { from: "Reacting", to: "Guiding" },
  resetName: "P.A.R.E.N.T.S.",
  framing:
    "When you are tired, it is easy to parent from frustration. Scripture calls parents to train children without provoking them.",
  why: "The goal is not control. The goal is formation — calm instruction, one lesson, one peaceful boundary.",
  steps: [
    {
      letter: "P",
      title: "Pause before you correct",
      verse: "James 1:19",
      explanation: "Be quick to hear, slow to speak, slow to anger.",
      action: "Breathe in 4, out 6.",
    },
    {
      letter: "A",
      title: "Aim for training, not venting",
      verse: "Proverbs 22:6",
      explanation: "Train up a child in the way he should go.",
      action: "Ask: “What am I training right now?”",
    },
    {
      letter: "R",
      title: "Raise without provoking",
      verse: "Ephesians 6:4",
      explanation: "Do not provoke your children to anger.",
      action: "Choose calm words.",
    },
    {
      letter: "E",
      title: "Encourage and instruct",
      verse: "Ephesians 6:4",
      explanation: "Bring them up in the discipline and instruction of the Lord.",
      action: "Say one clear instruction and one encouragement.",
    },
    {
      letter: "N",
      title: "Notice what the child needs",
      verse: "Philippians 2:4",
      explanation: "Look not only to your own interests.",
      action: "Ask: “Is this tiredness, hunger, fear, or disobedience?”",
    },
    {
      letter: "T",
      title: "Teach one lesson",
      verse: "Deuteronomy 6:6–7",
      explanation: "Teach them diligently — one sentence is enough for this moment.",
      action: "Teach one sentence.",
    },
    {
      letter: "S",
      title: "Set one boundary with peace",
      verse: "Proverbs 29:15",
      explanation: "A child left without guidance is not the same as a child treated harshly. Set a simple consequence calmly.",
      action: "Set one simple boundary calmly.",
    },
  ],
  whenToUse: [
    "You feel yourself getting reactive",
    "The home feels chaotic",
    "Discipline is needed",
    "You want to lead with calm strength",
  ],
  sixtySecond: [
    "Breathe and pause. (James 1:19)",
    "Ask: “What am I training?” (Proverbs 22:6)",
    "Give one calm instruction. (Ephesians 6:4)",
  ],
  prayer:
    "Lord, give me wisdom to lead my home. Help me discipline with love. Teach my children Your ways. Amen.",
  scripture: [
    { ref: "Ephesians 6:4", insight: "Instruction and non-provocation belong together." },
    { ref: "James 1:19", insight: "Slowness to anger is the first parenting act." },
  ],
  safetyNote:
    "This path never justifies harm. If a home is unsafe, seek wise help and lawful protection. Formation is not domination.",
  readNext: [
    { href: "/topics/children", title: "Children" },
    { href: "/topics/husband", title: "Husband" },
    { href: "/topics/wife", title: "Wife" },
  ],
};
