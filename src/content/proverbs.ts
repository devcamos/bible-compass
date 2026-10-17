/** Curated editorial summaries, not quotations from the NIV translation. */
export const PROVERBS_INTRODUCTION =
  "Proverbs brings together extended wisdom instructions and memorable sayings associated with Solomon and other contributors. Its foundation is reverence for God. These teachings offer wisdom for everyday life: principles to consider in context, not guarantees of wealth, safety or an immediate reward.";

export const PROVERBS_GRACE_GUARDRAIL =
  "Wisdom guides our response to God's grace. It is not a way to earn his love, and hardship is not proof that someone has failed to live wisely.";

export const PROVERBS_SELECTION_NOTE =
  "A curated selection of passages, not a complete catalogue of Proverbs. Chapters contain several themes; these selections highlight the chosen category. All summaries are original paraphrases. Read the linked NIV passage on Bible Gateway for the Scripture text.";

export const PROVERBS_CATEGORIES = [
  { slug: "words-and-speech", title: "Words & speech", description: "Listen carefully and speak with truth and gentleness.", icon: "💬" },
  { slug: "wisdom-and-discernment", title: "Wisdom & discernment", description: "Learn, accept correction and make thoughtful choices.", icon: "🧭" },
  { slug: "relationships", title: "Relationships", description: "Practise faithful friendship, honesty and care.", icon: "🤝" },
  { slug: "work-and-diligence", title: "Work & diligence", description: "Work steadily, plan wisely and entrust the results to God.", icon: "🌱" },
  { slug: "money-and-generosity", title: "Money & generosity", description: "Consider wealth, debt and care for neighbours.", icon: "🤲" },
  { slug: "character-and-integrity", title: "Character & integrity", description: "Grow in humility, honesty and self-control.", icon: "🪴" },
  { slug: "justice-and-leadership", title: "Justice & leadership", description: "Exercise authority fairly and speak for vulnerable people.", icon: "⚖️" },
  { slug: "walking-with-god", title: "Walking with God", description: "Trust God with your understanding, choices and work.", icon: "👣" },
] as const;

export type ProverbsCategory = (typeof PROVERBS_CATEGORIES)[number];
export type ProverbsCategorySlug = ProverbsCategory["slug"];

export interface ProverbsVerse {
  id: string;
  chapter: number;
  verse: number;
  title: string;
  summary: string;
  context: string;
  categorySlugs: readonly ProverbsCategorySlug[];
  relatedTopics: readonly string[];
}

function verse(
  chapter: number,
  verseNumber: number,
  title: string,
  summary: string,
  context: string,
  categorySlugs: readonly ProverbsCategorySlug[],
  relatedTopics: readonly string[],
): ProverbsVerse {
  return { id: `proverbs-${chapter}-${verseNumber}`, chapter, verse: verseNumber, title, summary, context, categorySlugs, relatedTopics };
}

export const PROVERBS_VERSES: readonly ProverbsVerse[] = [
  verse(1, 7, "Where wisdom begins", "Reverence for God opens the way to knowledge; rejecting instruction closes it.", "The opening chapter introduces the book's purpose. Reverence means taking God seriously, with humility and readiness to learn.", ["wisdom-and-discernment", "walking-with-god"], ["how-to-read-the-bible", "faith"]),
  verse(3, 5, "Trust beyond your understanding", "Rely on God wholeheartedly rather than treating your own understanding as sufficient.", "Read with verses 6–8: trust includes acknowledging God, humility and turning from evil. It does not dismiss careful thinking or good counsel.", ["wisdom-and-discernment", "walking-with-god"], ["trust", "faith"]),
  verse(3, 6, "Acknowledge God", "Bring God into every part of your life and look to him for direction.", "This continues the call to trust in verse 5. God's guidance is not a promise of an easy life or instant certainty about every decision.", ["walking-with-god"], ["trust", "prayer-and-worship"]),
  verse(4, 7, "Value understanding", "Make wisdom a priority and seek understanding even when it costs you something.", "A parent's extended instruction urges the learner to treasure wisdom. This is about the value of understanding, not buying God's favour.", ["wisdom-and-discernment"], ["how-to-read-the-bible", "teachings"]),
  verse(6, 6, "Learn from the ant", "Observe the ant's steady activity and learn to prepare rather than drift.", "Verses 6–11 contrast preparation with habitual neglect. The saying challenges avoidable idleness, not illness, disability or the need for rest.", ["work-and-diligence"], ["diligence", "hard-work"]),
  verse(9, 10, "Know the Holy One", "Reverence for God begins wisdom; knowing the Holy One deepens understanding.", "Chapter 9 sets wisdom's invitation beside folly's. Wisdom is rooted in relationship with God, not merely cleverness or success.", ["wisdom-and-discernment", "walking-with-god"], ["character-of-god", "faith"]),
  verse(10, 4, "Steady effort matters", "Neglect can lead to lack, while diligent work tends to provide.", "This contrast describes a pattern rather than a verdict on every poor person. Injustice and circumstances also affect what people have.", ["work-and-diligence"], ["diligence", "hard-work"]),
  verse(10, 9, "Walk with integrity", "Honest living provides a firmer footing than hidden wrongdoing.", "The saying contrasts integrity with crooked paths. Integrity does not guarantee physical safety or freedom from other people's wrongdoing.", ["character-and-integrity"], ["truth", "temptation-and-character"]),
  verse(11, 2, "Humility makes room to learn", "Pride can bring disgrace; humility leaves room for wisdom.", "This contrast links character and learning. Humility is honest teachability, not denying your dignity or accepting mistreatment.", ["character-and-integrity", "wisdom-and-discernment"], ["pride", "teachings"]),
  verse(11, 24, "Hold possessions generously", "Open-handed generosity can enrich life, while withholding what is due can diminish it.", "Read alongside verse 25's image of refreshing others. This is not an investment formula guaranteeing financial returns for donations.", ["money-and-generosity"], ["wealth", "greed"]),
  verse(12, 18, "Words can wound or heal", "Careless speech can cut deeply; wise words can bring healing.", "The contrast asks us to consider the effect of speech. Healing words may include honest correction, not simply saying what someone wants to hear.", ["words-and-speech", "relationships"], ["friendship", "self-control"]),
  verse(12, 19, "Truth endures", "Truthful speech has lasting worth; lies cannot provide a lasting foundation.", "This saying places truth beside deception. It commends faithfulness to truth rather than promising that every lie will immediately be exposed.", ["words-and-speech", "character-and-integrity"], ["truth", "temptation-and-character"]),
  verse(12, 22, "God values truthfulness", "Deception offends God; trustworthy conduct pleases him.", "The verse joins speech with action. Truthfulness involves being reliable as well as avoiding false statements.", ["words-and-speech", "character-and-integrity"], ["truth", "character-of-god"]),
  verse(13, 4, "Move from wanting to doing", "Desire alone achieves little; diligent effort tends to bear fruit.", "This contrasts passive wishing with steady action. It does not promise that hard work fulfils every desire or removes every barrier.", ["work-and-diligence"], ["diligence", "hard-work"]),
  verse(15, 1, "A gentle answer", "A gentle answer can calm anger; harsh words can stir it up.", "Proverbs 15 explores wise speech alongside other aspects of life. This saying commends gentleness; it does not guarantee another person's response or require staying in danger.", ["words-and-speech", "relationships", "character-and-integrity"], ["self-control", "peace"]),
  verse(15, 4, "Words can nurture or wound", "Healing speech can nourish life, while twisted words can crush the spirit.", "The tree-of-life image describes speech that sustains others. Gentle speech should still be truthful; manipulation and distortion can harm even when delivered softly.", ["words-and-speech", "relationships"], ["friendship", "truth"]),
  verse(15, 28, "Consider your answer", "A righteous person weighs a response; wicked speech pours out harm without care.", "The contrast concerns the heart behind speech as well as its speed. Taking time to answer can help us speak truthfully and responsibly.", ["words-and-speech", "wisdom-and-discernment"], ["self-control", "truth"]),
  verse(16, 3, "Entrust your work to God", "Commit what you do to God and trust him with the establishment of your plans.", "Read with the surrounding sayings about God's purposes. Commitment to God is not a technique for securing every outcome we prefer.", ["walking-with-god", "work-and-diligence"], ["diligence", "trust"]),
  verse(16, 12, "Authority needs righteousness", "Wickedness is incompatible with good kingship; righteous conduct gives authority a sound foundation.", "This saying addresses kings and the moral basis of rule. It offers a standard for leadership, not an endorsement of every existing ruler.", ["justice-and-leadership", "character-and-integrity"], ["truth", "temptation-and-character"]),
  verse(16, 32, "Strength in self-control", "Patient self-control is a greater strength than conquest without mastery of yourself.", "The saying compares restraint with military strength. It values patience over domination, without excusing abuse or forbidding protective action.", ["character-and-integrity", "relationships"], ["self-control", "patience"]),
  verse(17, 17, "Faithful friendship", "A true friend's love persists, and family bonds matter especially in adversity.", "This describes loyalty through difficulty. Healthy friendship does not require enabling harm or surrendering appropriate boundaries.", ["relationships"], ["friendship", "loneliness"]),
  verse(18, 13, "Listen before answering", "Answering before you have listened is foolish and can bring shame.", "The surrounding sayings consider speech, knowledge and conflict. Hear the person and seek the facts before deciding you already understand.", ["words-and-speech", "wisdom-and-discernment", "relationships"], ["friendship", "self-control"]),
  verse(18, 21, "Words have consequences", "Speech can serve life or cause destruction, and speakers live with its effects.", "The life-and-death language stresses the weight of speech. It does not teach that our words magically create reality or that suffering is caused by negative speech.", ["words-and-speech", "relationships"], ["truth", "self-control"]),
  verse(18, 24, "Depth over numbers", "Many companions do not guarantee support; a faithful friend can be exceptionally close.", "The saying contrasts the number of companions with the quality of loyalty. It invites care in friendship rather than withdrawal from community.", ["relationships"], ["friendship", "loneliness"]),
  verse(19, 17, "Care for people in need", "God takes kindness to people in poverty seriously and honours that generosity.", "The lending image gives dignity to care for the poor. It does not turn giving into a bargain for a guaranteed financial reward.", ["money-and-generosity", "justice-and-leadership"], ["wealth", "greed"]),
  verse(21, 3, "Justice matters to God", "God values doing what is right and just above religious offerings used in their place.", "This saying challenges the separation of worship from conduct. Giving or ritual cannot excuse injustice toward other people.", ["justice-and-leadership", "walking-with-god"], ["prayer-and-worship", "truth"]),
  verse(21, 5, "Plan with patience", "Steady planning tends toward provision; rushing without care can lead to lack.", "This is a practical contrast between diligence and haste. It neither guarantees profit nor assigns blame for poverty to everyone who experiences it.", ["work-and-diligence", "money-and-generosity"], ["diligence", "wealth"]),
  verse(22, 2, "Equal before our Maker", "Rich and poor share the same Maker; wealth does not determine a person's worth.", "The saying grounds shared human dignity in God. Other Proverbs sayings call for generous and just treatment of people in need.", ["money-and-generosity", "justice-and-leadership"], ["wealth", "character-of-god"]),
  verse(22, 7, "Recognise the weight of debt", "Wealth can bring power over others, and borrowing can create dependence on a lender.", "This describes an unequal relationship and warns about dependence. It is not a condemnation of every borrower or permission for lenders to exploit people.", ["money-and-generosity", "justice-and-leadership"], ["wealth", "greed"]),
  verse(27, 6, "Honesty within friendship", "A faithful friend's difficult correction may be more trustworthy than an enemy's show of affection.", "Read with verse 5's preference for open correction over concealed love. Honest care is distinct from cruelty, humiliation or coercion.", ["relationships", "wisdom-and-discernment"], ["friendship", "truth"]),
  verse(27, 17, "Help one another grow", "People can sharpen one another through meaningful interaction, as iron sharpens iron.", "The image commends the influence people have on one another. It calls for constructive engagement rather than treating harshness as proof of love.", ["relationships", "wisdom-and-discernment"], ["friendship", "teachings"]),
  verse(28, 13, "Confess and turn", "Concealing wrongdoing blocks a better path; admitting it and turning away opens the way to mercy.", "The saying joins confession with a change of direction. Mercy is not earned by flawless performance; honest repentance receives rather than purchases grace.", ["character-and-integrity", "walking-with-god"], ["forgiveness", "jesus-and-the-gospel"]),
  verse(29, 4, "Lead with justice", "A ruler's justice supports a country's stability; greed and exploitation undermine it.", "The verse contrasts just leadership with demands for gain. The principle is accountable authority that serves people rather than extracting from them.", ["justice-and-leadership", "money-and-generosity"], ["truth", "greed"]),
  verse(31, 9, "Speak for fair treatment", "Use your voice and judgment to defend the rights of people who are poor or in need.", "Read with verse 8 in the instruction given to King Lemuel. Leaders are called to hear vulnerable people and judge fairly, rather than overlook them.", ["justice-and-leadership"], ["truth", "wealth"]),
];

export function getProverbsCategory(slug: string): ProverbsCategory | undefined {
  return PROVERBS_CATEGORIES.find((category) => category.slug === slug);
}

export function getProverbsVerse(id: string): ProverbsVerse | undefined {
  return PROVERBS_VERSES.find((entry) => entry.id === id);
}

export function getProverbsVersesForCategory(slug: string): ProverbsVerse[] {
  const category = getProverbsCategory(slug);
  return category ? PROVERBS_VERSES.filter((entry) => entry.categorySlugs.includes(category.slug)) : [];
}

export function getProverbsChapterGroups(slug: string): { chapter: number; verses: ProverbsVerse[] }[] {
  const groups = new Map<number, ProverbsVerse[]>();
  for (const entry of getProverbsVersesForCategory(slug)) {
    const entries = groups.get(entry.chapter) ?? [];
    entries.push(entry);
    groups.set(entry.chapter, entries);
  }
  return [...groups].sort(([left], [right]) => left - right)
    .map(([chapter, verses]) => ({ chapter, verses: verses.toSorted((left, right) => left.verse - right.verse) }));
}

export function proverbsVerseUrl(chapter: number, verseNumber: number): string {
  const reference = `Proverbs ${chapter}:${verseNumber}`;
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(reference)}&version=NIV`;
}

export function proverbsChapterUrl(chapter: number): string {
  const reference = `Proverbs ${chapter}`;
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(reference)}&version=NIV`;
}
