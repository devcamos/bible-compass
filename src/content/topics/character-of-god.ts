import type { Topic } from "../types";

export const characterOfGod: Topic = {
  slug: "character-of-god",
  title: "Character of God",
  icon: "✨",
  summary:
    "Attributes to collect as you read: faithful, holy, merciful, just, patient, wise, near, sovereign.",
  tone: "bible",
  kind: "foundation",
  graceGuardrail:
    "God's character is news to receive. Listing attributes is worship, not a ladder.",
  framing:
    "The editorial page is still a collecting frame. Use the format below whenever a passage shows you who God is.",
  sections: [
    {
      heading: "Attributes to collect",
      paragraphs: ["Start with these, then add what the passage in front of you actually says:"],
      bullets: [
        "Faithful",
        "Holy",
        "Merciful",
        "Just",
        "Patient",
        "Wise",
        "Near to the brokenhearted",
        "Sovereign",
      ],
    },
    {
      heading: "Suggested format",
      paragraphs: ["For each attribute you study:"],
      bullets: [
        "Definition in your own words",
        "Anchor verses in context",
        "What this means for life today",
        "A prayer response",
      ],
    },
  ],
  prayer:
    "Lord, show me who You are. Let Your mercy and holiness hold together in Jesus. Amen.",
  readNext: [
    { href: "/topics/jesus-and-the-gospel", title: "Jesus and the Gospel" },
    { href: "/topics/promises-vs-commands", title: "Promises vs commands" },
    { href: "/topics/prayer-and-worship", title: "Prayer and worship" },
  ],
};
