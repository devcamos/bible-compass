import data from "./gifts-data.json";
import { bsbUrl } from "@/lib/scripture-mapping.mjs";

export type GiftReference = { book: string; chapter: number; verse: number; label: string };
export type GiftEntry = {
  id: string;
  title: string;
  summary: string;
  meaning: string;
  context: string;
  example: string;
  step: string;
  kind: "gift" | "role";
  refs: GiftReference[];
  overviewRefs: GiftReference[];
  related: string[][];
  namingScripture: { ref: GiftReference; text: string; highlight: string };
};
export type GiftsSection = {
  id: string; title: string; summary: string; body?: string;
  refs?: GiftReference[]; related?: string[][];
};
const content = data as { sections: GiftsSection[]; gifts: GiftEntry[] };
export const GIFTS_SECTIONS = content.sections;
export const GIFTS = content.gifts;
export const GIFTS_FOR_SERVING = GIFTS.filter(({ kind }) => kind === "gift");
export const GIFTS_MINISTRY_ROLES = GIFTS.filter(({ kind }) => kind === "role");
export const GIFTS_FOUNDATIONS = GIFTS_SECTIONS.filter(({ id }) => id !== "spiritual-gifts");
export const GIFTS_GRACE = "God’s gifts are received by grace, not earned. They lead us towards Jesus and service to others, rather than a ranking of faith.";
export const GIFTS_PURPOSE = "The gifts describe ways God equips believers to serve others and build up the church. Their purpose is the common good, shaped by love—not spiritual status.";
export const GIFTS_SELECTION_NOTE = "These passages overlap. They describe complementary forms of service rather than one universally agreed, exhaustive count of gifts.";
export const GIFTS_INTRODUCTION = [
  "Begin with grace: salvation and eternal life are God’s gifts, received through faith in Christ.",
  "The Holy Spirit is God’s promised presence. Gifts for service and the fruit of the Spirit describe different aspects of Christian life.",
  "Read the passages together, with their setting and the wider Bible in view. Love shapes the use of every gift.",
  "Christians understand some gifts and ministry roles differently. Read, pray and reflect with trusted Christian community.",
];
export function giftUrl(id: string) { return `/gifts/spiritual-gifts/${id}`; }
export function giftReferenceUrl(ref: GiftReference) { return bsbUrl(ref.book, ref.chapter, ref.verse); }
export function giftChapterUrl(ref: GiftReference) { return bsbUrl(ref.book, ref.chapter); }
export function getGift(id: string) { return GIFTS.find(gift => gift.id === id); }
export function getGiftsFoundation(id: string) { return GIFTS_FOUNDATIONS.find(section => section.id === id); }
export const GIFTS_READING_PAGES = [
  { path: "/gifts", title: "Gifts from God", context: "Received in grace · used in love" },
  ...GIFTS_SECTIONS.map(section => ({ path: `/gifts/${section.id}`, title: section.title, context: "Gifts from God" })),
  ...GIFTS.map(gift => ({ path: giftUrl(gift.id), title: gift.title, context: `${gift.kind === "role" ? "Ministry role" : "Gifts for serving"} · ${gift.namingScripture.ref.label}` })),
];
