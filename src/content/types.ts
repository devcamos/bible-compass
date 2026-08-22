export type NextLink = {
  href: string;
  title: string;
};

export type ResetStep = {
  letter: string;
  title: string;
  verse: string;
  explanation: string;
  action?: string;
};

export type TopicTone = "peace" | "courage" | "faith" | "bible";

/** Nested shelf item: label, short kid-friendly detail, optional book list. */
export type SectionItem = {
  label: string;
  detail?: string;
  children?: string[];
};

export type TopicSection = {
  heading: string;
  paragraphs: string[];
  /** Simple one-line bullets (label — detail). */
  bullets?: string[];
  /** Cards with optional nested book lists. */
  items?: SectionItem[];
};

export type Topic = {
  slug: string;
  title: string;
  icon: string;
  summary: string;
  tone: TopicTone;
  kind: "reset" | "foundation";
  /** Always appear in public authoring: grace is not earned through effort. */
  graceGuardrail: string;
  stateChange?: { from: string; to: string };
  resetName?: string;
  framing?: string;
  why?: string;
  steps?: ResetStep[];
  whenToUse?: string[];
  sixtySecond?: string[];
  prayer?: string;
  scripture?: { ref: string; insight: string }[];
  safetyNote?: string;
  sections?: TopicSection[];
  readNext: NextLink[];
};
