import type { Topic } from "./types";
import { anxiety } from "./topics/anxiety";
import { beingPresent } from "./topics/being-present";
import { bibleTimeline } from "./topics/bible-timeline";
import { booksDescribed } from "./topics/books-described";
import { characterOfGod } from "./topics/character-of-god";
import { children } from "./topics/children";
import { componentsOfTheBible } from "./topics/components-of-the-bible";
import { courage } from "./topics/courage";
import { destinyOfTheWorld } from "./topics/destiny-of-the-world";
import { diligence } from "./topics/diligence";
import { failure } from "./topics/failure";
import { faith } from "./topics/faith";
import { fear } from "./topics/fear";
import { hardWork } from "./topics/hard-work";
import { howToReadTheBible } from "./topics/how-to-read-the-bible";
import { husband } from "./topics/husband";
import { jesusAndTheGospel } from "./topics/jesus-and-the-gospel";
import { lettingGo } from "./topics/letting-go";
import { loneliness } from "./topics/loneliness";
import { motivationalMen } from "./topics/motivational-men";
import { motivationalWomen } from "./topics/motivational-women";
import { parents } from "./topics/parents";
import { patience } from "./topics/patience";
import { peopleOfTheBible } from "./topics/people-of-the-bible";
import { prayerAndWorship } from "./topics/prayer-and-worship";
import { promisesVsCommands } from "./topics/promises-vs-commands";
import { safetyAndGodsProtection } from "./topics/safety-and-gods-protection";
import { success } from "./topics/success";
import { teachings } from "./topics/teachings";
import { themes } from "./topics/themes";
import { trust } from "./topics/trust";
import { wife } from "./topics/wife";

export const topics: Topic[] = [
  jesusAndTheGospel,
  loneliness,
  fear,
  anxiety,
  lettingGo,
  beingPresent,
  courage,
  trust,
  faith,
  safetyAndGodsProtection,
  hardWork,
  diligence,
  patience,
  failure,
  success,
  husband,
  wife,
  children,
  parents,
  howToReadTheBible,
  componentsOfTheBible,
  bibleTimeline,
  booksDescribed,
  peopleOfTheBible,
  themes,
  promisesVsCommands,
  characterOfGod,
  prayerAndWorship,
  destinyOfTheWorld,
  teachings,
  motivationalMen,
  motivationalWomen,
];

export const TOPIC_SLUGS = topics.map((topic) => topic.slug);

const topicBySlug = new Map(topics.map((topic) => [topic.slug, topic]));

export function getTopic(slug: string): Topic | undefined {
  return topicBySlug.get(slug);
}

export function requireTopic(slug: string): Topic {
  const topic = getTopic(slug);
  if (!topic) {
    throw new Error(`Unknown Bible Compass topic: ${slug}`);
  }
  return topic;
}

export const PUBLIC_ROUTES = [
  "/",
  "/how-to-use",
  "/health",
  ...TOPIC_SLUGS.map((slug) => `/topics/${slug}`),
] as const;
