import type { TopicTone } from "./types";

export type EntryPath = {
  href: string;
  icon: string;
  title: string;
  summary: string;
  tone: TopicTone;
};

export type LifeArea = {
  icon: string;
  title: string;
  summary: string;
  defaultOpen?: boolean;
  topicSlugs: string[];
};

export const homeCopy = {
  eyebrow: "Bible Compass",
  welcomeTitle: "Come as you are.",
  welcomeBody:
    "Meet Scripture with an open heart, understand it in context, and take one faithful step at a time.",
  howToLabel: "New here? How to use Bible Compass",
  carryingTitle: "What are you carrying today?",
  rhythmTitle: "Your Compass rhythm",
  rhythmBody:
    "Choose a path, read in context, hold one truth, then take one faithful step.",
  lifeAreaTitle: "Explore by life area",
  foundationTitle: "Start here",
  foundationBody:
    "Jesus and the Gospel is the centre of Bible Compass. Grace precedes effort.",
};

export const entryPaths: EntryPath[] = [
  {
    href: "/topics/anxiety",
    icon: "🕊️",
    title: "I need peace",
    summary: "When your mind feels heavy, uncertain, or afraid.",
    tone: "peace",
  },
  {
    href: "/topics/courage",
    icon: "🛡️",
    title: "I need courage",
    summary: "When the next faithful step feels difficult or unclear.",
    tone: "courage",
  },
  {
    href: "/topics/faith",
    icon: "🌱",
    title: "I want to grow in faith",
    summary: "When you want a deeper walk with God, not just more information.",
    tone: "faith",
  },
  {
    href: "/topics/how-to-read-the-bible",
    icon: "🧱",
    title: "I want to understand the Bible",
    summary: "When you want clarity, context, and reverence.",
    tone: "bible",
  },
];

export const lifeAreas: LifeArea[] = [
  {
    icon: "🕊️",
    title: "Peace, fear and inner strength",
    summary: "Come here when your mind feels heavy, uncertain, or afraid.",
    defaultOpen: true,
    topicSlugs: [
      "fear",
      "anxiety",
      "courage",
      "trust",
      "faith",
      "safety-and-gods-protection",
      "loneliness",
    ],
  },
  {
    icon: "🌱",
    title: "Work, growth and perseverance",
    summary: "Patience, discipline, failure, and faithful effort — without earning God.",
    topicSlugs: ["hard-work", "diligence", "patience", "failure", "success"],
  },
  {
    icon: "🤍",
    title: "Family and relationships",
    summary: "Wisdom for loving, leading, forgiving, and building a healthy home.",
    topicSlugs: ["husband", "wife", "children", "parents"],
  },
  {
    icon: "📖",
    title: "Understand the Bible — foundations",
    summary: "How Scripture fits together, and how to read it with Jesus at the centre.",
    topicSlugs: [
      "jesus-and-the-gospel",
      "components-of-the-bible",
      "how-to-read-the-bible",
      "bible-timeline",
      "books-described",
    ],
  },
  {
    icon: "✨",
    title: "People, themes and doctrine",
    summary: "People, promises, themes, and truths that reveal God's character.",
    topicSlugs: [
      "people-of-the-bible",
      "themes",
      "promises-vs-commands",
      "character-of-god",
      "prayer-and-worship",
      "destiny-of-the-world",
    ],
  },
  {
    icon: "🧭",
    title: "Biblical laws and principles",
    summary: "Love, forgiveness, diligence, sowing and reaping, and wise boundaries.",
    topicSlugs: ["teachings"],
  },
  {
    icon: "👣",
    title: "People worth studying",
    summary: "Lives shaped by courage, obedience, failure, restoration, and faith.",
    topicSlugs: ["motivational-men", "motivational-women"],
  },
];
