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
  sections?: { heading: string; paragraphs: string[]; bullets?: string[] }[];
  readNext: NextLink[];
};
