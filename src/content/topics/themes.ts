import type { Topic } from "../types";

export const themes: Topic = {
  slug: "themes",
  title: "Themes",
  icon: "🏷️",
  summary:
    "A master list of themes to keep building. Several already have public Compass paths.",
  tone: "bible",
  kind: "foundation",
  graceGuardrail:
    "A theme is a way of noticing God. Collecting themes is not the same as earning closeness.",
  framing:
    "The editorial notebook still wants a page per theme. This path names the list and points to the routes that already exist.",
  sections: [
    {
      heading: "Themes to keep building",
      paragraphs: ["Use this as a map, not a finished library:"],
      bullets: [
        "Faith, fear, peace, wisdom",
        "Repentance, holiness, mercy, justice",
        "Suffering, leadership, money and generosity",
        "Speech and self-control, forgiveness",
        "Pride and humility, identity in Christ",
      ],
    },
    {
      heading: "Suggested format for a later theme page",
      paragraphs: ["When a theme is written in full, keep:"],
      bullets: [
        "Theme summary in one to three sentences",
        "Key verses in context",
        "What the verses highlight about God",
        "Practices for this week",
        "A short prayer",
      ],
    },
  ],
  prayer:
    "Lord, teach me Your themes without letting me treat them as a checklist for acceptance. Amen.",
  readNext: [
    { href: "/topics/faith", title: "Faith" },
    { href: "/topics/fear", title: "Fear" },
    { href: "/topics/teachings", title: "Teachings" },
  ],
};
