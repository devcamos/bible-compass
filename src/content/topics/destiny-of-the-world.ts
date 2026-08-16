import type { Topic } from "../types";

export const destinyOfTheWorld: Topic = {
  slug: "destiny-of-the-world",
  title: "The destiny of the world",
  icon: "🌍",
  summary:
    "The world is not ending in chaos. It is moving toward restoration. Lift your eyes to what God promised.",
  tone: "bible",
  kind: "reset",
  graceGuardrail:
    "Hope is anchored in God's promise of new creation, not in humanity fixing the world well enough first.",
  stateChange: { from: "Despair", to: "Hope" },
  resetName: "N.E.W.",
  framing:
    "When you focus only on the present world, decay can feel final. Scripture teaches that creation is groaning, and God is working toward renewal.",
  why: "Hope becomes practical when you name the brokenness honestly, expect restoration, and take one hopeful action today.",
  steps: [
    {
      letter: "N",
      title: "Name the brokenness honestly",
      verse: "Romans 8:19–21",
      explanation: "Creation waits to be set free from its bondage to decay.",
      action: "Write: “What feels broken right now?”",
    },
    {
      letter: "E",
      title: "Expect restoration",
      verse: "Revelation 21:4",
      explanation: "He will wipe away every tear. Death shall be no more.",
      action: "Say slowly: “God will make this new.”",
    },
    {
      letter: "W",
      title: "Walk with hope today",
      verse: "Romans 15:13",
      explanation: "May the God of hope fill you with all joy and peace.",
      action: "Choose one hopeful action: encourage someone, pray, serve, or create.",
    },
  ],
  whenToUse: [
    "You feel tired of suffering",
    "The news makes you feel heavy",
    "You feel discouraged about the future",
    "You need hope beyond circumstances",
  ],
  sixtySecond: [
    "Say: “Decay is not the end.” (Romans 8:19–21)",
    "Say: “God will wipe every tear.” (Revelation 21:4)",
    "Do one hopeful action.",
  ],
  prayer:
    "God of hope, lift my eyes. Fill me with joy and peace. Help me live with eternal perspective. Amen.",
  scripture: [
    { ref: "Romans 8:19–21", insight: "Groaning is not the last word." },
    { ref: "Revelation 21:4", insight: "Tears are named, then wiped." },
  ],
  readNext: [
    { href: "/topics/trust", title: "Trust" },
    { href: "/topics/bible-timeline", title: "Bible timeline" },
    { href: "/topics/jesus-and-the-gospel", title: "Jesus and the Gospel" },
  ],
};
