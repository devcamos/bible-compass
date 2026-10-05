# Biblical concepts

The Concepts catalogue sits below Explore by life area. Start here now lives on How to use; Jesus and the Gospel remains the foundational route.

## Data model

`src/content/concepts/ontology.json` is the curated, versioned source. IDs are stable kebab-case identifiers. A concept has one browsing family, multiple concept types, theological domains and life areas, and mappings to existing topics and canonical Scripture ranges. Family is a navigation choice, not a statement that other classifications are invalid. For example, repentance is both a practice and a doctrine.

Relationships are directed triples (`sourceId`, `predicate`, `targetId`). Every relationship includes an editorial explanation and Scripture IDs from its source concept. The UI shows both incoming and outgoing relationships. Scripture summaries and classifications are editorial study aids, not quotations or a definitive theological taxonomy.

`GET /concepts/data` downloads JSON with the catalogue, relationships, life-area registry and topic registry. No user data is included. Use IDs to join records, and explode array fields into separate rows for many-to-many analysis. `schemaVersion` tracks the export shape. Preserve existing IDs when changing wording; introduce a new schema version for incompatible shape changes.

## Analysis semantics

Search matches titles, summaries and aliases, including armour/armor and judgment/judgement. Filters combine with AND across family, type, domain and life area. Counts describe the curated catalogue, not the frequency or importance of concepts across the Bible. A concept may appear in multiple facet rows. Passage/topic counts count mappings, not distinct Bible verses or topics. Relationship counts require both endpoints to be in the filtered set. The JSON download always exports the full ontology.

Topic pages derive reverse concept links from the same mappings, rather than duplicating data. Concept routes are statically generated and included in the sitemap. An unknown concept returns 404. The catalogue keeps the existing reader theme and grace guardrail.

## Verification

`npm run verify` checks data integrity, topic and facet references, traceable relationships, types, lint and the production build. CI smoke-tests the home, guide, concept explorer, export and every concept route. Vercel Preview must be green before founder review. Merge and production release remain subject to founder approval.
