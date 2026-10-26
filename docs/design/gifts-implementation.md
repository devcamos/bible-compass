# Gifts from God

The approved presentation lists each gift with a plain meaning and linked Scripture. Ephesians ministry roles are presented separately. The desktop table becomes a readable vertical list on phones, keeping every description available without opening a disclosure.

The compact Foundations link opens `/gifts`, retaining the HTML sample's four introductory areas: grace and salvation, the Holy Spirit, gifts for serving, and love/the fruit of the Spirit. `/gifts/spiritual-gifts` shows the agreed descriptions. Each gift name opens its individual reading: verified BSB naming verse, highlighted words, plain explanation, supporting passages, context, everyday illustration, reflection and related concepts. Back returns focus to that entry.

The selected gifts and roles overlap; the UI does not claim an exhaustive total. Quoted Scripture is labelled BSB and original explanations remain distinct. Interpretive differences, prayerful discernment, compassion and grace remain explicit.

Discernment's existing everyday-life section also explores friends, family, relationships, work and business. Each example gives a situation, what to notice, a response and linked Scripture, followed by questions for examining both the influence and one's own assumptions. These are applications of testing spiritual claims alongside biblical wisdom, clearly distinguished from additional definitions of the gift or certainty about hidden motives. The other gift descriptions retain their agreed presentation.

There are 27 canonical reading routes, using the existing local Save page controls, allowlist and sitemap. Content is static; no runtime Scripture fetch, new dependency, database, account or permission is required.

Seven naming verses were verified against public-domain BSB Scripture in [1 Corinthians 12](https://biblehub.com/bsb/1_corinthians/12.htm), [Romans 12](https://biblehub.com/bsb/romans/12.htm) and [Ephesians 4](https://biblehub.com/bsb/ephesians/4.htm). Source fixtures preserve exact wording; the ministry-role quotation cites Ephesians 4:11 while supporting links retain the wider passage. The prototype discussion is [PR49](https://github.com/devcamos/bible-compass/pull/49).

`npm run verify` includes the Gifts content, quotation, route, canonical URL, lookup, published-link, Foundations, catalog, sitemap and saved-reading compatibility contracts. `scripts/gifts.preview.mjs` checks the actual immutable Git Preview using a private access configuration. It does not start a local server or send app feedback/notifications. UI evidence is synthetic Chromium, with Scripture destinations inspected rather than external-provider availability certified.

This implements the approved feature presentation. Merge, Production release and user launch communications require their applicable founder approvals and release checks.
