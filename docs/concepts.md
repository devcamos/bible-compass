# Biblical concepts

The Concepts catalogue sits below Explore by life area. Start here now lives on How to use; Jesus and the Gospel remains the foundational route.

## Reader format

Every concept page leads with Key Bible Verse, Concept Explained, then How the Bible Suggests Living With This [concept family]. Short NIV excerpts are labelled, with links to the exact verse and its surrounding context. Every suggested action has Scripture references. Concept pages keep the reader focused on these three sections and the grace guardrail. Classification, relationship and topic mapping data remain in the ontology and JSON export for analysis; no mapping details section is shown on concept pages.

Judgement leads with Matthew 7:1 and links to Matthew 7:1-5. Its explanation distinguishes hypocritical judgment, fair discernment in John 7:24, and God's judgment.

Concept pages use explicit heading, paragraph and reference spacing, including on mobile. Quotation openings are capitalised for display; the original source text remains unchanged in the ontology and JSON export.

Every action across all concepts has its own curated verse mapping. For example, Fruit of the Spirit links walking by the Spirit to Galatians 5:16, practising the fruit to 5:22-23, and releasing rivalry to 5:26. Full passages remain available as key-verse context.

## Data model

`src/content/concepts/ontology.json` is the curated, versioned source. IDs are stable kebab-case identifiers. A concept has one browsing family, multiple concept types, theological domains and life areas, and mappings to existing topics and canonical Scripture ranges. Family is a navigation choice, not a statement that other classifications are invalid. For example, repentance is both a practice and a doctrine.

Relationships are directed triples (`sourceId`, `predicate`, `targetId`). Every relationship includes an editorial explanation and Scripture IDs from its source concept. The export retains both incoming and outgoing relationships for analysis. Scripture summaries, living guidance and classifications are editorial study aids. They are distinct from the labelled key-verse quotation.

Schema 1.2.0 retains `keyVerse`, `explanation` and `livingGuidance`, and adds required `scriptureReferences` to every action. Each reference has a `passageId`, `verseStart` and `verseEnd`. `scriptureIds` remains available for joining to the source passages, and must match the IDs used by the precise references. Existing concept, action, passage and relationship IDs are preserved.

## Scripture mapping engine

`guidancePassages` delegates to the shared `resolveScriptureReferences` engine. It resolves the action's approved passage IDs and narrows them to the curated verse ranges. The reader uses those resolved ranges for both the displayed reference and Bible Gateway link. It does not fall back to displaying a whole context passage when an action has no specific mapping.

When adding a concept or action, identify the verses that support the idea and add explicit references within the registered source ranges. Add a source passage if the supporting verse is not registered. Multiple verse references are supported when an idea needs them; select Scripture on its meaning, rather than inventing different verses just to make references unique. The wider context passage and key verse stay independent from the action reference.

The engine rejects missing references, unknown source IDs, non-integer or reversed verse ranges, ranges outside their source passage, and duplicate references. Content validation applies this same engine to every action before build. Mappings remain editorial study interpretations; range validation checks structural integrity, not the theological meaning of a passage.

`GET /concepts/data` downloads JSON with the catalogue, relationships, life-area registry and topic registry. No user data is included. Use IDs to join records, and explode array fields into separate rows for many-to-many analysis. `schemaVersion` tracks the export shape. Preserve existing IDs when changing wording; introduce a new schema version for incompatible shape changes.

## Analysis semantics

Search matches titles, summaries and aliases, including armour/armor and judgment/judgement. Filters combine with AND across family, type, domain and life area. Counts describe the curated catalogue, not the frequency or importance of concepts across the Bible. A concept may appear in multiple facet rows. Passage/topic counts count mappings, not distinct Bible verses or topics. Relationship counts require both endpoints to be in the filtered set. The JSON download always exports the full ontology.

Topic pages derive reverse concept links from the same mappings, rather than duplicating data. Concept routes are statically generated and included in the sitemap. An unknown concept returns 404. The catalogue keeps the existing reader theme and grace guardrail.

## Verification

`npm run verify` checks data integrity, topic and facet references, traceable relationships, the shared reference engine, types, lint and the production build. CI smoke-tests the home, guide, concept explorer and export. `node scripts/concept-references-smoke.mjs` checks every rendered concept action against its precise reference data, including link text and the NIV destination. Vercel Preview must be green before founder review. Merge and production release remain subject to founder approval.
