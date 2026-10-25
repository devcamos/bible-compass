import { bsbUrl } from "@/lib/scripture-mapping.mjs";

/** Curated original paraphrases, not quotations from the BSB translation. */
export const REVELATION_CONCEPT_MAPPING = {
  book: "Revelation",
  conceptSlugs: ["worship", "wisdom"],
  relationship: "explores",
} as const;

export const REVELATION_INTRODUCTION = [
  {
    "title": "Jesus at the centre.",
    "text": "A revelation of Jesus Christ given to John, bringing encouragement, challenge and hope to the churches."
  },
  {
    "title": "Its first hearers.",
    "text": "Addressed to seven churches in Roman Asia facing different pressures, temptations and forms of suffering."
  },
  {
    "title": "Its kind of writing.",
    "text": "A prophetic letter filled with apocalyptic visions, symbolic numbers and images drawn from earlier Scripture."
  },
  {
    "title": "Read in context.",
    "text": "Christians interpret several visions and their timing differently. Begin with the passage, its first hearers and the wider Bible before making present-day applications."
  },
  {
    "title": "Grace and endurance.",
    "text": "Faithfulness responds to Christ's grace. Hardship does not prove that someone's faith has failed, and hope makes room for honest grief."
  }
] as const;

export const REVELATION_GRACE_GUARDRAIL =
  "Jesus is at the centre of Revelation. Its visions call Christians to faithful hope and worship; God's love remains a gift, not a reward for decoding every symbol.";

/** Show only within the parent page's closed introduction disclosure. */
export const REVELATION_SELECTION_NOTE =
  "These selected chapters and passages are starting points, not a complete explanation of every vision. Themes overlap. Summaries are original paraphrases; the Scripture links open the BSB text on Bible Hub at the first selected verse.";

export const REVELATION_CATEGORIES = [
  {
    "slug": "jesus-and-worship",
    "title": "Jesus & worship",
    "description": "Attend to Christ and respond to the worship at the heart of the visions."
  },
  {
    "slug": "faithfulness-under-pressure",
    "title": "Faithfulness under pressure",
    "description": "Find encouragement for faithful living amid opposition, temptation and suffering."
  },
  {
    "slug": "discernment-and-allegiance",
    "title": "Discernment & allegiance",
    "description": "Consider the claims of power, the pull of deception and the call to worship God."
  },
  {
    "slug": "justice-and-hope",
    "title": "Justice & hope",
    "description": "Bring the longing for justice alongside a vision of God's care for his people."
  },
  {
    "slug": "restoration-and-new-creation",
    "title": "Restoration & new creation",
    "description": "Look towards God's presence, healing and the renewal pictured at the book's close."
  }
] as const;

export type RevelationCategory = (typeof REVELATION_CATEGORIES)[number];
export type RevelationCategorySlug = RevelationCategory["slug"];

export interface RevelationRelatedLink {
  href: string;
  title: string;
}

export interface RevelationPassage {
  id: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  title: string;
  summary: string;
  context: string;
  categorySlugs: readonly RevelationCategorySlug[];
  relatedTopics: readonly string[];
  relatedLinks: readonly RevelationRelatedLink[];
}

export const REVELATION_PASSAGES: readonly RevelationPassage[] = [
  {
    "id": "revelation-1-17-18",
    "chapter": 1,
    "verseStart": 17,
    "verseEnd": 18,
    "title": "The risen Christ reassures John",
    "summary": "John is reassured by the risen Jesus, who holds authority over death.",
    "context": "John's vision opens with a commission to seven churches. Christ's reassurance supports faithfulness amid pressure; it does not promise immediate freedom from suffering.",
    "categorySlugs": [
      "jesus-and-worship"
    ],
    "relatedTopics": [
      "jesus-and-the-gospel"
    ],
    "relatedLinks": [
      {
        "href": "/psalms/praise-and-worship",
        "title": "Psalms: Praise & worship"
      }
    ]
  },
  {
    "id": "revelation-4-8-11",
    "chapter": 4,
    "verseStart": 8,
    "verseEnd": 11,
    "title": "Worship the Creator",
    "summary": "The vision honours God as holy Creator, worthy of worship.",
    "context": "The heavenly throne, living creatures and elders draw on earlier Scripture. Read their place in the vision's worship before applying symbolic details to present-day events.",
    "categorySlugs": [
      "jesus-and-worship"
    ],
    "relatedTopics": [
      "jesus-and-the-gospel"
    ],
    "relatedLinks": [
      {
        "href": "/psalms/praise-and-worship",
        "title": "Psalms: Praise & worship"
      }
    ]
  },
  {
    "id": "revelation-5-9-10",
    "chapter": 5,
    "verseStart": 9,
    "verseEnd": 10,
    "title": "A people gathered through the Lamb",
    "summary": "People from across the nations are gathered through the Lamb's redeeming work and called to serve God.",
    "context": "The Lamb who was slain is central to Revelation's picture of victory. The surrounding worship connects redemption with service to God across human divisions.",
    "categorySlugs": [
      "jesus-and-worship"
    ],
    "relatedTopics": [
      "jesus-and-the-gospel"
    ],
    "relatedLinks": [
      {
        "href": "/psalms/praise-and-worship",
        "title": "Psalms: Praise & worship"
      }
    ]
  },
  {
    "id": "revelation-5-12-13",
    "chapter": 5,
    "verseStart": 12,
    "verseEnd": 13,
    "title": "Praise to God and the Lamb",
    "summary": "Praise extends to the Lamb and to the One seated on the throne.",
    "context": "The scene gathers many voices in worship. Its centre is God and the Lamb; read the imagery alongside the wider chapter's account of redemption.",
    "categorySlugs": [
      "jesus-and-worship"
    ],
    "relatedTopics": [
      "jesus-and-the-gospel"
    ],
    "relatedLinks": [
      {
        "href": "/psalms/praise-and-worship",
        "title": "Psalms: Praise & worship"
      }
    ]
  },
  {
    "id": "revelation-2-10-11",
    "chapter": 2,
    "verseStart": 10,
    "verseEnd": 11,
    "title": "Faithfulness amid suffering",
    "summary": "The church in Smyrna is urged to remain faithful through suffering, with hope in the life Christ gives.",
    "context": "This is part of a particular message to one of the seven churches. Read its comfort and challenge together; suffering is not evidence that a person has failed to believe well enough.",
    "categorySlugs": [
      "faithfulness-under-pressure"
    ],
    "relatedTopics": [],
    "relatedLinks": [
      {
        "href": "/proverbs/wisdom-and-discernment",
        "title": "Proverbs: Wisdom & discernment"
      },
      {
        "href": "/psalms/trust-and-refuge",
        "title": "Psalms: Trust & refuge"
      }
    ]
  },
  {
    "id": "revelation-3-7-13",
    "chapter": 3,
    "verseStart": 7,
    "verseEnd": 13,
    "title": "Hold fast to Christ",
    "summary": "Christ encourages the church in Philadelphia to hold fast amid opposition.",
    "context": "The message addresses a particular community and commends patient endurance. Keep its original setting in view; Christians differ on how some promises apply across times.",
    "categorySlugs": [
      "faithfulness-under-pressure"
    ],
    "relatedTopics": [],
    "relatedLinks": [
      {
        "href": "/proverbs/wisdom-and-discernment",
        "title": "Proverbs: Wisdom & discernment"
      },
      {
        "href": "/psalms/trust-and-refuge",
        "title": "Psalms: Trust & refuge"
      }
    ]
  },
  {
    "id": "revelation-14-12-13",
    "chapter": 14,
    "verseStart": 12,
    "verseEnd": 13,
    "title": "Patient faithfulness",
    "summary": "The vision commends patient faithfulness and portrays those who die in the Lord as blessed.",
    "context": "This comfort appears amid images of judgment and worship. Its focus is perseverance in Christ; hardship does not prove that God has rejected someone.",
    "categorySlugs": [
      "faithfulness-under-pressure"
    ],
    "relatedTopics": [],
    "relatedLinks": [
      {
        "href": "/proverbs/wisdom-and-discernment",
        "title": "Proverbs: Wisdom & discernment"
      },
      {
        "href": "/psalms/trust-and-refuge",
        "title": "Psalms: Trust & refuge"
      }
    ]
  },
  {
    "id": "revelation-13-1-4",
    "chapter": 13,
    "verseStart": 1,
    "verseEnd": 4,
    "title": "Discern the claims of power",
    "summary": "The vision portrays destructive power claiming allegiance and receiving worship.",
    "context": "Readers differ on how the beast imagery relates to history and future events. Begin with its first hearers and scriptural imagery before making present-day applications; avoid treating a resemblance to a contemporary person or institution as proof of fulfilment.",
    "categorySlugs": [
      "discernment-and-allegiance"
    ],
    "relatedTopics": [],
    "relatedLinks": [
      {
        "href": "/proverbs/wisdom-and-discernment",
        "title": "Proverbs: Wisdom & discernment"
      },
      {
        "href": "/psalms/wisdom-and-everyday-living",
        "title": "Psalms: Wisdom & everyday living"
      }
    ]
  },
  {
    "id": "revelation-13-11-14",
    "chapter": 13,
    "verseStart": 11,
    "verseEnd": 14,
    "title": "The pull of deception",
    "summary": "A second figure uses signs and influence to draw people towards false worship.",
    "context": "Read the symbolic narrative alongside the calls for endurance and discernment. The passage invites examination of allegiance; striking signs alone do not settle what deserves worship.",
    "categorySlugs": [
      "discernment-and-allegiance"
    ],
    "relatedTopics": [],
    "relatedLinks": [
      {
        "href": "/proverbs/wisdom-and-discernment",
        "title": "Proverbs: Wisdom & discernment"
      },
      {
        "href": "/psalms/wisdom-and-everyday-living",
        "title": "Psalms: Wisdom & everyday living"
      }
    ]
  },
  {
    "id": "revelation-14-6-7",
    "chapter": 14,
    "verseStart": 6,
    "verseEnd": 7,
    "title": "Honour the Creator",
    "summary": "An angel's proclamation calls people across the earth to honour God the Creator.",
    "context": "The call to worship sits beside warnings about destructive allegiances. Read the surrounding visions as well as this short proclamation when considering what shapes trust and loyalty.",
    "categorySlugs": [
      "discernment-and-allegiance"
    ],
    "relatedTopics": [],
    "relatedLinks": [
      {
        "href": "/proverbs/wisdom-and-discernment",
        "title": "Proverbs: Wisdom & discernment"
      },
      {
        "href": "/psalms/wisdom-and-everyday-living",
        "title": "Psalms: Wisdom & everyday living"
      }
    ]
  },
  {
    "id": "revelation-6-9-11",
    "chapter": 6,
    "verseStart": 9,
    "verseEnd": 11,
    "title": "A cry for justice",
    "summary": "Those killed for their witness bring their cry for justice before God.",
    "context": "The vision makes room for lament even in heaven and entrusts judgment to God. Read it with Jesus' teaching on love and justice, supporting people who have been harmed without encouraging personal revenge.",
    "categorySlugs": [
      "justice-and-hope"
    ],
    "relatedTopics": [],
    "relatedLinks": [
      {
        "href": "/psalms/lament-and-honest-prayer",
        "title": "Psalms: Lament & honest prayer"
      },
      {
        "href": "/psalms/justice-and-hope",
        "title": "Psalms: Justice & hope"
      }
    ]
  },
  {
    "id": "revelation-7-9-12",
    "chapter": 7,
    "verseStart": 9,
    "verseEnd": 12,
    "title": "A multitude from every nation",
    "summary": "A vast community from across the nations stands before God and the Lamb in worship.",
    "context": "The vision follows chapter 6's anxiety and portrays God's people across human divisions. Its hope encourages solidarity across cultures and worship centred on God.",
    "categorySlugs": [
      "justice-and-hope"
    ],
    "relatedTopics": [],
    "relatedLinks": [
      {
        "href": "/psalms/lament-and-honest-prayer",
        "title": "Psalms: Lament & honest prayer"
      },
      {
        "href": "/psalms/justice-and-hope",
        "title": "Psalms: Justice & hope"
      }
    ]
  },
  {
    "id": "revelation-7-13-17",
    "chapter": 7,
    "verseStart": 13,
    "verseEnd": 17,
    "title": "Shelter after suffering",
    "summary": "God's care is pictured as shelter, living water and an end to tears for a people who have endured great suffering.",
    "context": "Christians understand the timing and identity of this vision in different ways. Its comfort can be held alongside unresolved grief; it does not set a timetable for an individual's healing.",
    "categorySlugs": [
      "justice-and-hope"
    ],
    "relatedTopics": [],
    "relatedLinks": [
      {
        "href": "/psalms/lament-and-honest-prayer",
        "title": "Psalms: Lament & honest prayer"
      },
      {
        "href": "/psalms/justice-and-hope",
        "title": "Psalms: Justice & hope"
      }
    ]
  },
  {
    "id": "revelation-21-1-4",
    "chapter": 21,
    "verseStart": 1,
    "verseEnd": 4,
    "title": "God dwelling with his people",
    "summary": "The vision looks towards renewed creation where God dwells with his people and grief gives way to life.",
    "context": "The book's closing vision follows its judgment imagery. God's promised restoration grounds hope without requiring people to deny the pain of the present.",
    "categorySlugs": [
      "restoration-and-new-creation"
    ],
    "relatedTopics": [
      "jesus-and-the-gospel"
    ],
    "relatedLinks": [
      {
        "href": "/psalms/justice-and-hope",
        "title": "Psalms: Justice & hope"
      }
    ]
  },
  {
    "id": "revelation-21-22-27",
    "chapter": 21,
    "verseStart": 22,
    "verseEnd": 27,
    "title": "Light for the nations",
    "summary": "God and the Lamb are pictured as the city's light, with the nations drawn into its life.",
    "context": "The city imagery gathers earlier scriptural themes of God's presence and the nations. Read the whole portrait; isolated details do not settle every interpretation of the book's ending.",
    "categorySlugs": [
      "restoration-and-new-creation"
    ],
    "relatedTopics": [
      "jesus-and-the-gospel"
    ],
    "relatedLinks": [
      {
        "href": "/psalms/justice-and-hope",
        "title": "Psalms: Justice & hope"
      }
    ]
  },
  {
    "id": "revelation-22-1-5",
    "chapter": 22,
    "verseStart": 1,
    "verseEnd": 5,
    "title": "Life, healing and light",
    "summary": "Water of life, healing and light picture life in God's presence.",
    "context": "The book closes with restoration and worship centred on God and the Lamb. This hope can encourage faithful care for others now; human effort is not the price of grace.",
    "categorySlugs": [
      "restoration-and-new-creation"
    ],
    "relatedTopics": [
      "jesus-and-the-gospel"
    ],
    "relatedLinks": [
      {
        "href": "/psalms/justice-and-hope",
        "title": "Psalms: Justice & hope"
      }
    ]
  }
];

export function getRevelationCategory(slug: string): RevelationCategory | undefined {
  return REVELATION_CATEGORIES.find((category) => category.slug === slug);
}

export function getRevelationPassage(id: string): RevelationPassage | undefined {
  return REVELATION_PASSAGES.find((passage) => passage.id === id);
}

export function getRevelationPassagesForCategory(slug: string): RevelationPassage[] {
  const category = getRevelationCategory(slug);
  return category ? REVELATION_PASSAGES.filter((passage) => passage.categorySlugs.includes(category.slug)) : [];
}

export function getRevelationGroups(slug: string): { chapter: number; passages: RevelationPassage[] }[] {
  const groups = new Map<number, RevelationPassage[]>();
  for (const passage of getRevelationPassagesForCategory(slug)) {
    const entries = groups.get(passage.chapter) ?? [];
    entries.push(passage);
    groups.set(passage.chapter, entries);
  }
  return [...groups].sort(([left], [right]) => left - right)
    .map(([chapter, passages]) => ({ chapter, passages: passages.toSorted((left, right) => left.verseStart - right.verseStart) }));
}

/** BSB chapter URL, anchored at the first selected verse when supplied. */
export function revelationUrl(chapter: number, verse?: number): string {
  return bsbUrl("Revelation", chapter, verse);
}

/** Internal route builder; the page validates category membership before rendering. */
export function revelationPassageUrl(categorySlug: string, passageId: string): string {
  return `/revelation/${categorySlug}/verses/${passageId}`;
}

export function revelationVerseReference(passage: Pick<RevelationPassage, "chapter" | "verseStart" | "verseEnd">): string {
  const range = passage.verseEnd === passage.verseStart ? "" : `–${passage.verseEnd}`;
  return `Revelation ${passage.chapter}:${passage.verseStart}${range}`;
}
