type HowToStep =
  | {
      title: string;
      body: string;
    }
  | {
      title: string;
      body: string;
      href: string;
      linkLabel: string;
    };

export const howToUse = {
  title: "How to use Bible Compass",
  summary:
    "A simple way to meet Scripture with honesty, context, and one faithful response.",
  graceTitle: "Start with grace, not performance.",
  graceBody:
    "You do not use Scripture to earn God's love. You respond to the grace already offered in Jesus.",
  steps: [
    {
      title: "Start with Jesus and the Gospel",
      body: "If you are new to faith or need to return to the centre, begin there. Grace precedes effort.",
      href: "/topics/jesus-and-the-gospel",
      linkLabel: "Open Jesus and the Gospel",
    },
    {
      title: "Choose what you are carrying",
      body: "When a pressure, question, or relationship needs God's wisdom, pick the closest path on the home page.",
      href: "/",
      linkLabel: "Open the Compass home",
    },
    {
      title: "Read the cited passage in context",
      body: "Open the surrounding chapter in your preferred translation. Scripture remains the authority; Bible Compass is a study aid.",
    },
    {
      title: "Use the reset or reflection",
      body: "Hold one truth and take one responsible next step. A sixty-second version is there when time is short.",
    },
    {
      title: "Follow Read next",
      body: "Use it when you need deeper understanding or a related path. You do not have to finish every page in one sitting.",
    },
    {
      title: "Return as life changes",
      body: "Bible Compass is a guide for the journey, not a one-time answer.",
    },
  ] satisfies HowToStep[],
  closing:
    "You are seen. You are loved. You are not alone. Let each passage draw you closer to God, steady your heart, and help you walk forward with faith.",
};
