# Prophetic book summaries

The Components of the Bible page offers a short summary for all 17 books in its Major and Minor Prophets lists. Selecting a book opens a small native dialog. It shows a summary, three themes, a practical takeaway, an NIV passage link and the BibleProject guide used for editorial research. Major and minor describe the length of the collections, not their importance.

## Content

`src/content/prophets/books.json` is the local editorial registry. Each record has a stable ID, title, group, summary, takeaway, themes, structured passage and source URL. The summaries are original paraphrases, not copied Scripture or guide text. Lamentations is included in the traditional five-book Major Prophets collection and described as anonymous poems rather than assigning disputed authorship.

The two relevant section items in `components-of-the-bible.json` select their summary group with `bookSummaryGroup`. Existing book names remain in `children` and the content contract checks exact coverage and order. Other book lists retain their existing presentation.

## Reader behaviour

`TopicView` supplies the relevant local records to the small `ProphetBookList` client component. There is no runtime request to a content provider. The dialog has a labelled title, a Close button, native Escape and focus management, a scrollable body, and a backdrop close handler. Background scrolling is restored on close or unmount. With JavaScript disabled, expandable summaries remain available in a `noscript` fallback.

Headings use the shared `bc-heading` size and colours use existing theme tokens. Scripture links reuse the same canonical reference and URL helpers as the concepts reader.

## Verification

`npm run verify` checks book coverage, IDs, required content and source links, followed by linting, type checking and a production build. `scripts/prophet-summaries-smoke.mjs` checks the built page for all 17 triggers, both labelled dialogs and the complete static fallback with exact Scripture links. The PR workflow runs this smoke test. These checks do not substitute for interactive browser checks of focus, Escape, backdrop closing and mobile layout.
