# Gifts from God — HTML design proposal

Open `/designs/gifts.html` on this branch's Git Preview. The review board shows Foundations → Gifts from God → gifts for serving → Teaching. **Try the walkthrough** opens the complete interactive flow; individual steps and light/dark previews are available. `/designs/gifts-flow.html` is the standalone HTML version.

This is a design sample for discussion, not an implemented Gifts feature. It adds no app navigation, content routes, saved-page catalog entries, accounts, persistence, permissions, notifications or dependencies. Existing reader and reminder behavior remain unchanged. The sample does not register a service worker or call application APIs. No Production merge/release is requested by this proposal.

## Design decision

Review the compact Foundations placement, four introductory areas and gift detail layout before app implementation. The alternative is discovery only through existing related concept pages, with no additional home row. Use the same system fonts, serif headings, cream/copper/gold tokens, spacing and header pattern as the Revelation sample.

Each gift is individually named. Its detail page starts with the actual BSB verse, highlighting the words naming that gift with both bold type and an underline. The plain explanation follows directly underneath. A verse citation and full-chapter link accompany the quotation; supporting passages, context, an everyday illustration and reflection remain below. The first list displays the nine gifts in 1 Corinthians 12 separately, including discernment and healing. Romans 12, helping/administration and the Ephesians 4 ministry roles have their own Scripture-labelled sections; names remain visible in disclosure summaries. The lists overlap and are not presented as one exhaustive total. Examples and reflections do not diagnose a person's gifts or appoint someone to a role.

The quotations use the public-domain Berean Standard Bible, verified against the Scripture text in [1 Corinthians 12](https://biblehub.com/bsb/1_corinthians/12.htm), [Romans 12](https://biblehub.com/bsb/romans/12.htm) and [Ephesians 4](https://biblehub.com/bsb/ephesians/4.htm). All 22 individual entries quote their naming verse: 1 Corinthians 12:8–10, 28; Romans 12:7–8; or Ephesians 4:11. Ministry-role pages quote verse 11 explicitly and retain the wider 4:11–13 supporting reference. Quoted Scripture and original explanations are labelled separately. The HTML contains these verified quotations; it does not fetch Scripture at runtime.

## Selected Scripture map

| Area | Selected reading |
| --- | --- |
| Grace and salvation | Ephesians 2:8–10; Romans 6:23 |
| The Holy Spirit | Acts 2:38–39; Ephesians 1:13–14 |
| A message of wisdom | 1 Corinthians 12:8 |
| A message of knowledge | 1 Corinthians 12:8 |
| Faith | 1 Corinthians 12:9 |
| Gifts of healing | 1 Corinthians 12:9, 11, 29–30 |
| Working of miracles | 1 Corinthians 12:10 |
| Prophecy | 1 Corinthians 12:10; 14:3, 29; Romans 12:6 |
| Discernment / distinguishing between spirits | 1 Corinthians 12:10; 1 John 4:1–3 |
| Different kinds of tongues | 1 Corinthians 12:10; 14:5, 27–28 |
| Interpretation of tongues | 1 Corinthians 12:10; 14:13, 27–28 |
| Serving | Romans 12:7; 1 Peter 4:10–11 |
| Teaching | Romans 12:7; 1 Corinthians 12:28 |
| Encouragement | Romans 12:8–13 |
| Giving | Romans 12:8; 2 Corinthians 8:12 |
| Leadership | Romans 12:8 |
| Mercy | Romans 12:8, 15 |
| Helping | 1 Corinthians 12:28 |
| Administration and guidance | 1 Corinthians 12:28 |
| Apostles, prophets, evangelists, pastors and teachers | Ephesians 4:11–16 |
| Love and spiritual fruit | 1 Corinthians 13:1–7; Galatians 5:22–25 |

Read passages in context. Groupings are selected editorial aids, not an exhaustive classification. Keep salvation, the Holy Spirit, gifts for service, spiritual fruit and ministry roles distinct. Christian differences about some gifts are acknowledged. No personal gift diagnosis, spiritual ranking or guarantee of healing is offered. Summaries and explanations are original paraphrases; quotations are labelled BSB. Verse and full-chapter links use the existing BSB destination pattern.
