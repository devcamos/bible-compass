import { topics } from "@/content";
import { concepts } from "@/content/concepts";
import { PROVERBS_CATEGORIES, PROVERBS_VERSES } from "@/content/proverbs";
import { PSALMS_CATEGORIES, PSALMS_VERSES, psalmVerseReference } from "@/content/psalms";
import { REVELATION_CATEGORIES, REVELATION_PASSAGES, revelationPassageUrl, revelationVerseReference } from "@/content/revelation";

export type ReadingPage = { path: string; title: string; context: string };
/** Content-derived allowlist: no query strings, arbitrary URLs or changing daily readings. */
export const SAVED_PAGE_CATALOG: ReadingPage[] = [
  ...topics.map((t) => ({ path: `/topics/${t.slug}`, title: t.title, context: "Bible Compass teaching" })),
  ...concepts.map((c) => ({ path: `/concepts/${c.slug}`, title: c.title, context: "Bible concept" })),
  { path: "/proverbs", title: "Proverbs", context: "Wisdom for everyday life" },
  ...PROVERBS_CATEGORIES.map((c) => ({ path: `/proverbs/${c.slug}`, title: c.title, context: "Proverbs" })),
  ...PROVERBS_VERSES.map((v) => ({ path: `/proverbs/verses/${v.id}`, title: v.title, context: `Proverbs ${v.chapter}:${v.verse}` })),
  { path: "/psalms", title: "Psalms", context: "Prayer, praise and honest faith" },
  ...PSALMS_CATEGORIES.map((c) => ({ path: `/psalms/${c.slug}`, title: c.title, context: "Psalms" })),
  ...PSALMS_VERSES.flatMap((v) => v.categorySlugs.map((category) => ({ path: `/psalms/${category}/verses/${v.id}`, title: v.title, context: `Psalm ${v.psalm}:${psalmVerseReference(v.verseStart, v.verseEnd)}` }))),
  { path: "/revelation", title: "Revelation", context: "Faithful hope in Christ" },
  ...REVELATION_CATEGORIES.map((c) => ({ path: `/revelation/${c.slug}`, title: c.title, context: "Revelation" })),
  ...REVELATION_PASSAGES.flatMap((p) => p.categorySlugs.map((category) => ({ path: revelationPassageUrl(category, p.id), title: p.title, context: revelationVerseReference(p) }))),
];
