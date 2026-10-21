/** Curated editorial paraphrases, not quotations from the NIV translation. */
export const PSALMS_CONCEPT_MAPPING = {
  book: "Psalms",
  conceptSlugs: ["prayer", "worship"],
  relationship: "explores",
} as const;

export const PSALMS_INTRODUCTION = [
  {"title": "What are Psalms?", "text": "Poetry, prayers and songs that bring praise, grief, trust, repentance and hope before God."},
  {"title": "Who contributed?", "text": "A collection compiled across contributors and generations, with many psalms associated with David and others with Asaph, the sons of Korah and further voices. Not every psalm names an author."},
  {"title": "How is it arranged?", "text": "The 150 psalms are traditionally grouped into five books. Read each poem as a whole, noticing its images, changes of voice and historical setting."},
  {"title": "How can I explore?", "text": "Choose a theme that speaks to your situation. These themes overlap: one psalm can move between lament, trust, thanks and praise."},
] as const;

export const PSALMS_GRACE_GUARDRAIL =
  "You can bring your honest words to God. Prayer, praise and repentance are responses to grace, not ways to earn God's love.";

/** Show only within the parent page's closed introduction disclosure. */
export const PSALMS_SELECTION_NOTE =
  "These selected psalms and verse highlights are starting points for exploring the collection, not all 150 psalms. The themes overlap. Summaries are original paraphrases; use the Scripture links to read the NIV text and each complete psalm.";

export const PSALMS_CATEGORIES = [
  {"slug": "trust-and-refuge", "title": "Trust & refuge", "description": "Find words for trusting God amid uncertainty."},
  {"slug": "lament-and-honest-prayer", "title": "Lament & honest prayer", "description": "Bring grief, questions and unresolved pain."},
  {"slug": "praise-and-worship", "title": "Praise & worship", "description": "Attend to who God is and respond with worship."},
  {"slug": "thanksgiving-and-remembrance", "title": "Thanksgiving & remembrance", "description": "Remember God's care and give thanks."},
  {"slug": "confession-and-renewal", "title": "Confession & renewal", "description": "Acknowledge wrongdoing and seek mercy and renewal."},
  {"slug": "wisdom-and-everyday-living", "title": "Wisdom & everyday living", "description": "Reflect on your path, God's instruction and life's limits."},
  {"slug": "justice-and-hope", "title": "Justice & hope", "description": "Pray for people facing oppression and for just rule."},
] as const;

export type PsalmsCategory = (typeof PSALMS_CATEGORIES)[number];
export type PsalmsCategorySlug = PsalmsCategory["slug"];

export interface PsalmsVerse {
  id: string;
  psalm: number;
  verseStart: number;
  verseEnd?: number;
  title: string;
  summary: string;
  context: string;
  categorySlugs: readonly PsalmsCategorySlug[];
  relatedTopics: readonly string[];
}

export const PSALMS_VERSES: readonly PsalmsVerse[] = [
  {"id": "psalm-23-1", "psalm": 23, "verseStart": 1, "title": "A shepherd's care", "summary": "The speaker trusts the Lord's shepherd-like care.", "context": "The poem includes enemies and danger as well as pasture and welcome. It promises neither universal physical safety nor financial plenty.", "categorySlugs": ["trust-and-refuge"], "relatedTopics": ["peace", "trust"]},
  {"id": "psalm-23-4", "psalm": 23, "verseStart": 4, "title": "Presence in the valley", "summary": "God's presence brings courage amid a threatening valley.", "context": "The poem includes enemies and danger as well as pasture and welcome. It promises neither universal physical safety nor financial plenty.", "categorySlugs": ["trust-and-refuge"], "relatedTopics": ["peace", "trust"]},
  {"id": "psalm-46-1", "psalm": 46, "verseStart": 1, "title": "Refuge in trouble", "summary": "God is a source of refuge and help in trouble.", "context": "Images of upheaval, conflict and God's city frame trust. Verse 10 is more than a private relaxation instruction; it belongs to a vision of God's rule and the ending of war.", "categorySlugs": ["trust-and-refuge"], "relatedTopics": ["trust", "peace"]},
  {"id": "psalm-46-10", "psalm": 46, "verseStart": 10, "title": "Recognise God’s authority", "summary": "Amid the vision of wars ending, the nations are summoned to recognise God's authority.", "context": "Images of upheaval, conflict and God's city frame trust. Verse 10 is more than a private relaxation instruction; it belongs to a vision of God's rule and the ending of war.", "categorySlugs": ["trust-and-refuge"], "relatedTopics": ["trust", "peace"]},
  {"id": "psalm-121-1-2", "psalm": 121, "verseStart": 1, "verseEnd": 2, "title": "Help from our Maker", "summary": "The traveller looks to the Maker of heaven and earth for help.", "context": "A song of ascents expressing confidence in God's keeping. Read its protection language as the poem's confession of trust, not a guarantee that believers will never suffer harm.", "categorySlugs": ["trust-and-refuge"], "relatedTopics": ["trust", "safety-and-gods-protection"]},
  {"id": "psalm-121-7-8", "psalm": 121, "verseStart": 7, "verseEnd": 8, "title": "Every journey in God’s keeping", "summary": "The song entrusts the traveller's life and every journey to God's keeping.", "context": "A song of ascents expressing confidence in God's keeping. Read its protection language as the poem's confession of trust, not a guarantee that believers will never suffer harm.", "categorySlugs": ["trust-and-refuge"], "relatedTopics": ["trust", "safety-and-gods-protection"]},
  {"id": "psalm-13-1", "psalm": 13, "verseStart": 1, "title": "How long?", "summary": "The speaker asks how long God will seem absent.", "context": "The turn toward trust belongs to this poem. It does not prescribe how quickly another person's grief should resolve.", "categorySlugs": ["lament-and-honest-prayer"], "relatedTopics": ["grief-and-loss", "trust"]},
  {"id": "psalm-13-5-6", "psalm": 13, "verseStart": 5, "verseEnd": 6, "title": "Remembered goodness", "summary": "The prayer turns toward trust in God's love and remembered goodness.", "context": "The turn toward trust belongs to this poem. It does not prescribe how quickly another person's grief should resolve.", "categorySlugs": ["lament-and-honest-prayer"], "relatedTopics": ["grief-and-loss", "trust"]},
  {"id": "psalm-42-1-2", "psalm": 42, "verseStart": 1, "verseEnd": 2, "title": "Thirsting for God", "summary": "Thirst becomes an image for longing for God.", "context": "Tears, displacement and repeated self-questioning continue through the poem. The refrain is a prayer within distress, not proof that anxiety or grief vanishes through effort.", "categorySlugs": ["lament-and-honest-prayer"], "relatedTopics": ["grief-and-loss", "loneliness"]},
  {"id": "psalm-42-5", "psalm": 42, "verseStart": 5, "title": "Hope within distress", "summary": "The troubled speaker addresses their own soul with a call to hope.", "context": "Tears, displacement and repeated self-questioning continue through the poem. The refrain is a prayer within distress, not proof that anxiety or grief vanishes through effort.", "categorySlugs": ["lament-and-honest-prayer"], "relatedTopics": ["grief-and-loss", "loneliness"]},
  {"id": "psalm-88-1-3", "psalm": 88, "verseStart": 1, "verseEnd": 3, "title": "Anguish brought to God", "summary": "The speaker brings persistent anguish to God.", "context": "No reassuring resolution is added to its ending. Its presence in Scripture makes room for prayer when relief and companionship remain absent. Avoid forcing a hopeful closing onto the text.", "categorySlugs": ["lament-and-honest-prayer"], "relatedTopics": ["grief-and-loss", "loneliness"]},
  {"id": "psalm-88-18", "psalm": 88, "verseStart": 18, "title": "An unresolved ending", "summary": "The poem ends in isolation and darkness.", "context": "No reassuring resolution is added to its ending. Its presence in Scripture makes room for prayer when relief and companionship remain absent. Avoid forcing a hopeful closing onto the text.", "categorySlugs": ["lament-and-honest-prayer"], "relatedTopics": ["grief-and-loss", "loneliness"]},
  {"id": "psalm-8-3-4", "psalm": 8, "verseStart": 3, "verseEnd": 4, "title": "Wonder beneath the heavens", "summary": "Looking at the heavens prompts wonder that God attends to human beings.", "context": "Wonder and human vocation belong together. This is not permission to dominate people or exploit the created world.", "categorySlugs": ["praise-and-worship"], "relatedTopics": ["character-of-god", "prayer-and-worship"]},
  {"id": "psalm-8-5-6", "psalm": 8, "verseStart": 5, "verseEnd": 6, "title": "Dignity and responsibility", "summary": "Human dignity is joined with responsibility within creation.", "context": "Wonder and human vocation belong together. This is not permission to dominate people or exploit the created world.", "categorySlugs": ["praise-and-worship"], "relatedTopics": ["character-of-god", "prayer-and-worship"]},
  {"id": "psalm-95-1-2", "psalm": 95, "verseStart": 1, "verseEnd": 2, "title": "A joyful invitation", "summary": "The community is invited to sing joyfully and approach God with thanks.", "context": "Thanksgiving and praise overlap here. The poem also warns against hardened hearts in verses 7–11; do not present only its opening as the whole message.", "categorySlugs": ["praise-and-worship"], "relatedTopics": ["prayer-and-worship", "faith"]},
  {"id": "psalm-95-6-7", "psalm": 95, "verseStart": 6, "verseEnd": 7, "title": "Before our Maker", "summary": "Worshippers bow before their Maker and recognise themselves as his people.", "context": "Thanksgiving and praise overlap here. The poem also warns against hardened hearts in verses 7–11; do not present only its opening as the whole message.", "categorySlugs": ["praise-and-worship"], "relatedTopics": ["prayer-and-worship", "faith"]},
  {"id": "psalm-150-1-2", "psalm": 150, "verseStart": 1, "verseEnd": 2, "title": "Praise God’s greatness", "summary": "Praise is directed to God for his works and greatness.", "context": "The collection closes with expansive praise and many instruments. This ending does not erase the collection's laments or require someone in acute grief to perform happiness.", "categorySlugs": ["praise-and-worship"], "relatedTopics": ["prayer-and-worship", "character-of-god"]},
  {"id": "psalm-150-6", "psalm": 150, "verseStart": 6, "title": "Let every breath praise", "summary": "Every breathing creature is called to praise.", "context": "The collection closes with expansive praise and many instruments. This ending does not erase the collection's laments or require someone in acute grief to perform happiness.", "categorySlugs": ["praise-and-worship"], "relatedTopics": ["prayer-and-worship", "character-of-god"]},
  {"id": "psalm-30-1-3", "psalm": 30, "verseStart": 1, "verseEnd": 3, "title": "Thanks for rescue", "summary": "The speaker thanks God for rescue from a life-threatening crisis.", "context": "A testimony to particular deliverance, not a timetable for everyone's healing. Its movement toward joy does not invalidate lament that remains unresolved.", "categorySlugs": ["thanksgiving-and-remembrance"], "relatedTopics": ["prayer-and-worship", "grief-and-loss"]},
  {"id": "psalm-30-11-12", "psalm": 30, "verseStart": 11, "verseEnd": 12, "title": "Grief turned to joy", "summary": "Grief turned to joy becomes a reason for ongoing thanks.", "context": "A testimony to particular deliverance, not a timetable for everyone's healing. Its movement toward joy does not invalidate lament that remains unresolved.", "categorySlugs": ["thanksgiving-and-remembrance"], "relatedTopics": ["prayer-and-worship", "grief-and-loss"]},
  {"id": "psalm-100-3", "psalm": 100, "verseStart": 3, "title": "Belonging to our Maker", "summary": "Worshippers remember that they belong to their Maker.", "context": "A communal invitation that links thanksgiving with praise. Thanksgiving attends to received goodness; praise attends to God's character, and this poem expresses both.", "categorySlugs": ["thanksgiving-and-remembrance"], "relatedTopics": ["prayer-and-worship", "character-of-god"]},
  {"id": "psalm-100-4-5", "psalm": 100, "verseStart": 4, "verseEnd": 5, "title": "Thanks for enduring love", "summary": "Thanks responds to God's goodness, enduring love and faithfulness.", "context": "A communal invitation that links thanksgiving with praise. Thanksgiving attends to received goodness; praise attends to God's character, and this poem expresses both.", "categorySlugs": ["thanksgiving-and-remembrance"], "relatedTopics": ["prayer-and-worship", "character-of-god"]},
  {"id": "psalm-107-1-2", "psalm": 107, "verseStart": 1, "verseEnd": 2, "title": "Remembering rescue", "summary": "People who have experienced God's rescue are invited to give thanks.", "context": "The poem offers several pictures of distress and deliverance. Its testimonies encourage remembrance without promising every crisis will end in the same way.", "categorySlugs": ["thanksgiving-and-remembrance"], "relatedTopics": ["trust", "prayer-and-worship"]},
  {"id": "psalm-107-8-9", "psalm": 107, "verseStart": 8, "verseEnd": 9, "title": "Care for those in need", "summary": "The rescued give thanks for steadfast love and care for those in need.", "context": "The poem offers several pictures of distress and deliverance. Its testimonies encourage remembrance without promising every crisis will end in the same way.", "categorySlugs": ["thanksgiving-and-remembrance"], "relatedTopics": ["trust", "prayer-and-worship"]},
  {"id": "psalm-32-1-2", "psalm": 32, "verseStart": 1, "verseEnd": 2, "title": "The blessing of forgiveness", "summary": "Forgiveness and freedom from concealed deceit are described as a blessing.", "context": "Confession is honest turning toward mercy, not a payment that purchases acceptance. Do not infer that all bodily pain is punishment for undisclosed sin.", "categorySlugs": ["confession-and-renewal"], "relatedTopics": ["forgiveness", "truth"]},
  {"id": "psalm-32-5", "psalm": 32, "verseStart": 5, "title": "Honesty instead of hiding", "summary": "The speaker acknowledges wrongdoing instead of hiding it and receives forgiveness.", "context": "Confession is honest turning toward mercy, not a payment that purchases acceptance. Do not infer that all bodily pain is punishment for undisclosed sin.", "categorySlugs": ["confession-and-renewal"], "relatedTopics": ["forgiveness", "truth"]},
  {"id": "psalm-51-1-2", "psalm": 51, "verseStart": 1, "verseEnd": 2, "title": "An appeal for mercy", "summary": "The speaker appeals to God's mercy for cleansing.", "context": "Traditionally associated with David's wrongdoing; its superscription refers to Nathan confronting David concerning Bathsheba. Mercy does not excuse harm, erase responsibility or require victims to reconcile.", "categorySlugs": ["confession-and-renewal"], "relatedTopics": ["forgiveness", "jesus-and-the-gospel"]},
  {"id": "psalm-51-10", "psalm": 51, "verseStart": 10, "title": "A prayer for renewal", "summary": "The prayer asks for inner renewal and a steadfast spirit.", "context": "Traditionally associated with David's wrongdoing; its superscription refers to Nathan confronting David concerning Bathsheba. Mercy does not excuse harm, erase responsibility or require victims to reconcile.", "categorySlugs": ["confession-and-renewal"], "relatedTopics": ["forgiveness", "jesus-and-the-gospel"]},
  {"id": "psalm-130-1-2", "psalm": 130, "verseStart": 1, "verseEnd": 2, "title": "A voice from the depths", "summary": "A voice from the depths asks God to listen.", "context": "Waiting and hope accompany repentance. Forgiveness is rooted in God's character, not a flawless emotional performance or a prescribed amount of remorse.", "categorySlugs": ["confession-and-renewal"], "relatedTopics": ["forgiveness", "patience"]},
  {"id": "psalm-130-3-4", "psalm": 130, "verseStart": 3, "verseEnd": 4, "title": "Forgiveness with God", "summary": "The speaker recognises both human wrongdoing and the possibility of forgiveness with God.", "context": "Waiting and hope accompany repentance. Forgiveness is rooted in God's character, not a flawless emotional performance or a prescribed amount of remorse.", "categorySlugs": ["confession-and-renewal"], "relatedTopics": ["forgiveness", "patience"]},
  {"id": "psalm-1-1-2", "psalm": 1, "verseStart": 1, "verseEnd": 2, "title": "Delighting in God’s instruction", "summary": "The wise path resists destructive counsel and delights in God's instruction.", "context": "The opening poem contrasts two ways of life. Its fruitfulness imagery is not a universal promise of wealth, constant productivity or freedom from illness.", "categorySlugs": ["wisdom-and-everyday-living"], "relatedTopics": ["how-to-read-the-bible", "temptation-and-character"]},
  {"id": "psalm-1-3", "psalm": 1, "verseStart": 3, "title": "Rooted and fruitful", "summary": "A well-watered tree pictures rootedness and fruitfulness in season.", "context": "The opening poem contrasts two ways of life. Its fruitfulness imagery is not a universal promise of wealth, constant productivity or freedom from illness.", "categorySlugs": ["wisdom-and-everyday-living"], "relatedTopics": ["how-to-read-the-bible", "temptation-and-character"]},
  {"id": "psalm-19-1", "psalm": 19, "verseStart": 1, "title": "Creation declares God’s glory", "summary": "The heavens are pictured as declaring God's glory.", "context": "The poem moves from creation to God's instruction and then personal prayer. Reading only its opening misses the movement toward teachability and self-examination.", "categorySlugs": ["wisdom-and-everyday-living"], "relatedTopics": ["character-of-god", "prayer-and-worship"]},
  {"id": "psalm-19-14", "psalm": 19, "verseStart": 14, "title": "Words and inward reflection", "summary": "The speaker asks that words and inward reflection be acceptable to God.", "context": "The poem moves from creation to God's instruction and then personal prayer. Reading only its opening misses the movement toward teachability and self-examination.", "categorySlugs": ["wisdom-and-everyday-living"], "relatedTopics": ["character-of-god", "prayer-and-worship"]},
  {"id": "psalm-90-1-2", "psalm": 90, "verseStart": 1, "verseEnd": 2, "title": "God across the generations", "summary": "God's enduring presence is set against the passing of generations.", "context": "Traditionally linked to Moses. Mortality, grief and the plea for God's favour frame its wisdom; numbering our days is not a command to maximise output or fear every lost moment.", "categorySlugs": ["wisdom-and-everyday-living"], "relatedTopics": ["being-present", "grief-and-loss"]},
  {"id": "psalm-90-12", "psalm": 90, "verseStart": 12, "title": "Wisdom in life’s limits", "summary": "Awareness of life's limits becomes a prayer for wisdom.", "context": "Traditionally linked to Moses. Mortality, grief and the plea for God's favour frame its wisdom; numbering our days is not a command to maximise output or fear every lost moment.", "categorySlugs": ["wisdom-and-everyday-living"], "relatedTopics": ["being-present", "grief-and-loss"]},
  {"id": "psalm-10-1", "psalm": 10, "verseStart": 1, "title": "Questions amid trouble", "summary": "The speaker questions God's seeming distance amid trouble.", "context": "The poem names exploitation and brings the demand for justice before God. Its prayer is not permission to pursue personal revenge or threaten another person with divine punishment.", "categorySlugs": ["justice-and-hope"], "relatedTopics": ["prayer-and-worship", "trust"]},
  {"id": "psalm-10-17-18", "psalm": 10, "verseStart": 17, "verseEnd": 18, "title": "Hear those facing oppression", "summary": "The prayer looks to God to hear oppressed people and uphold those without protection.", "context": "The poem names exploitation and brings the demand for justice before God. Its prayer is not permission to pursue personal revenge or threaten another person with divine punishment.", "categorySlugs": ["justice-and-hope"], "relatedTopics": ["prayer-and-worship", "trust"]},
  {"id": "psalm-72-1-2", "psalm": 72, "verseStart": 1, "verseEnd": 2, "title": "A prayer for just rule", "summary": "A prayer asks that the king govern with God's justice.", "context": "A royal prayer, traditionally associated with Solomon. It offers a vision of accountable leadership rather than an endorsement of every ruler or party.", "categorySlugs": ["justice-and-hope"], "relatedTopics": ["character-of-god", "wealth"]},
  {"id": "psalm-72-12-14", "psalm": 72, "verseStart": 12, "verseEnd": 14, "title": "Defending people in need", "summary": "Good rule is pictured as defending people in need against oppression and violence.", "context": "A royal prayer, traditionally associated with Solomon. It offers a vision of accountable leadership rather than an endorsement of every ruler or party.", "categorySlugs": ["justice-and-hope"], "relatedTopics": ["character-of-god", "wealth"]},
  {"id": "psalm-82-3-4", "psalm": 82, "verseStart": 3, "verseEnd": 4, "title": "Defend vulnerable people", "summary": "Those exercising judgment are called to defend vulnerable people and rescue those in need.", "context": "The divine-council imagery is interpreted in different ways. The clear ethical demand is just judgment; avoid claiming the passage grants readers divine status or authority to punish others.", "categorySlugs": ["justice-and-hope"], "relatedTopics": ["truth", "character-of-god"]},
  {"id": "psalm-82-8", "psalm": 82, "verseStart": 8, "title": "A plea for just judgment", "summary": "The poem calls on God to judge the earth.", "context": "The divine-council imagery is interpreted in different ways. The clear ethical demand is just judgment; avoid claiming the passage grants readers divine status or authority to punish others.", "categorySlugs": ["justice-and-hope"], "relatedTopics": ["truth", "character-of-god"]},

];

export function getPsalmsCategory(slug: string): PsalmsCategory | undefined {
  return PSALMS_CATEGORIES.find((category) => category.slug === slug);
}

export function getPsalmsVerse(id: string): PsalmsVerse | undefined {
  return PSALMS_VERSES.find((entry) => entry.id === id);
}

export function getPsalmsVersesForCategory(slug: string): PsalmsVerse[] {
  const category = getPsalmsCategory(slug);
  return category ? PSALMS_VERSES.filter((entry) => entry.categorySlugs.includes(category.slug)) : [];
}

export function getPsalmsGroups(slug: string): { psalm: number; verses: PsalmsVerse[] }[] {
  const groups = new Map<number, PsalmsVerse[]>();
  for (const entry of getPsalmsVersesForCategory(slug)) {
    const entries = groups.get(entry.psalm) ?? [];
    entries.push(entry);
    groups.set(entry.psalm, entries);
  }
  return [...groups].sort(([left], [right]) => left - right)
    .map(([psalm, verses]) => ({ psalm, verses: verses.toSorted((left, right) => left.verseStart - right.verseStart) }));
}

export function psalmVerseReference(verseStart: number, verseEnd?: number): string {
  return verseEnd === undefined ? `${verseStart}` : `${verseStart}-${verseEnd}`;
}

export function psalmVerseUrl(psalm: number, verseStart: number, verseEnd?: number): string {
  const reference = `Psalm ${psalm}:${psalmVerseReference(verseStart, verseEnd)}`;
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(reference)}&version=NIV`;
}

export function psalmUrl(psalm: number): string {
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(`Psalm ${psalm}`)}&version=NIV`;
}
