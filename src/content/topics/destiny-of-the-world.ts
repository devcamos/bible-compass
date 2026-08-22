import type { Topic } from "../types";

export const destinyOfTheWorld: Topic = {
  slug: "destiny-of-the-world",
  title: "The destiny of the world",
  icon: "🌍",
  summary:
    "Chaos and judgment are not the last word. Scripture ends with a new heaven and a new earth — God making all things new.",
  tone: "bible",
  kind: "reset",
  graceGuardrail:
    "Hope is anchored in God's promise of new creation, not in humanity fixing the world well enough first.",
  stateChange: { from: "Despair", to: "Hope" },
  resetName: "N.E.W.",
  framing:
    "When you focus only on the present age, decay and conflict can feel final. Revelation shows this world order passing away under God's judgment — and then God dwelling with His people in a renewed creation. Hope does not deny the hard middle; it refuses to stop before the ending.",
  why: "Hope becomes practical when you name the brokenness honestly, trust that Christ has the last word, and take one faithful step today.",
  steps: [
    {
      letter: "N",
      title: "Name the brokenness honestly",
      verse: "Romans 8:19–21",
      explanation:
        "Creation waits to be set free from its bondage to decay. Groaning is real — and it is not the whole story.",
      action: "Write: “What feels broken right now?”",
    },
    {
      letter: "E",
      title: "Expect God's new creation",
      verse: "Revelation 21:1–5",
      explanation:
        "The first heaven and earth pass away. God will wipe every tear; death shall be no more. He makes all things new — after judgment, not instead of it.",
      action: "Say slowly: “Jesus has the last word. God will make this new.”",
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
    "Say: “Groaning is not the last word.” (Romans 8:19–21)",
    "Say: “God will make all things new.” (Revelation 21:1–5)",
    "Do one hopeful action.",
  ],
  prayer:
    "God of hope, lift my eyes. You see the brokenness and You will judge evil. Fill me with joy and peace as I wait for Your new creation. Help me live today with eternal perspective. Amen.",
  scripture: [
    { ref: "Romans 8:19–21", insight: "Groaning is not the last word." },
    {
      ref: "Revelation 21:1",
      insight: "A new heaven and new earth — the present order is not forever.",
    },
    { ref: "Revelation 21:4–5", insight: "Tears are named, then wiped; He makes all things new." },
  ],
  readNext: [
    { href: "/topics/trust", title: "Trust" },
    { href: "/topics/bible-timeline", title: "Bible timeline" },
    { href: "/topics/jesus-and-the-gospel", title: "Jesus and the Gospel" },
  ],
};
