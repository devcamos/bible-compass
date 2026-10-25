# Saved pages

Readers can save a teaching, concept, Proverbs, Psalms or Revelation book, category or exact passage page, then return through **Your Profile → Saved pages**. The home page has no extra card. The list is on this browser/device only, with at most200 active entries. Clearing browser data or ending a private-browsing session can remove it. This is not a backup, cross-device sync or an offline Scripture copy.

The canonical catalog derives titles and destinations from current content. The changing verse-of-the-day route, home, help, feedback, APIs and design artifacts are excluded. Query strings, fragments, unknown IDs and invalid Psalm category/passage combinations are not saved. Stored metadata is limited to canonical path, time, opaque revision and removal state; no Scripture text, contacts, push subscription or feedback identity is copied.

## Storage and updates

Browser IndexedDB database `bible-compass-saved-pages`, version1, has one `pages` object store keyed by path. A read/write transaction validates current records and applies one mutation, so concurrent tabs cannot replace a whole-list snapshot and lose each other's saves. Save is idempotent. Removal records a tombstone; Undo restores only the matching removal revision and preserves unrelated changes. A newer same-page operation makes an old Undo expire safely. Successful commits are required before showing success. Stored rows, active count and shape are bounded; unknown versions or damaged records fail without erasing the list.

BroadcastChannel refreshes other open tabs after a commit. Where unavailable, focus/visibility/pageshow refresh the view; transaction safety is unchanged, but an inactive view may stay stale until reactivated. Existing automatic-update and before-unload guards also check pending saved-page actions from opening storage through commit/refresh. Completed data stays in its separate database across normal app reloads/updates. Browser eviction, process termination and physical-device behavior remain platform limits.

Profile links to the focusable Saved pages heading so keyboard navigation continues after the streamed destination mounts and the dialog closes. An in-page removal owns its adjacent-row/Undo focus after its local controls commit; an animation frame alone cannot guarantee that React has rendered Undo. The separate refresh recovery applies to externally removed focused rows.

The reader stays statically rendered and usable when JavaScript or storage fails. Saving uses no app API, account, permission prompt, third-party service or server database. Existing preference, reminder, rating and feedback storage remains separate. Errors distinguish unavailable data from an empty list and retain the reading. Retry does not clear data automatically.

## Verification

`npm run verify` includes transaction tests using the development-only `fake-indexeddb` package: persisted reopening, separate-connection concurrency, idempotency, stale/replayed Undo, capacity races, malformed/unknown data, failed/blocked/version opens, rollback and the pending reload guard. Actual browser checks must separately verify the complete Preview journey, focus, real storage/reload, cross-tab convergence, error/retry states and existing reader/BSB/reminder behavior at narrow light/dark widths. Model tests do not certify a physical phone, assistive technology, browser eviction or an actual two-release Home Screen update.

Run `node scripts/saved-pages-focus.preview.mjs /private/path/preview-access.json` separately against an authenticated immutable Git Preview. Its private mode-0600 config contains `origin`, same-origin `shareUrl` and the exact full `commit`. It checks the deployment identity before exercising keyboard Profile navigation, repeated final-item removal/Undo and cross-tab focus recovery at narrow light/dark widths. It blocks application API mutations, notification permission requests and push subscriptions. Keep access URLs and the config out of source control, and revoke any temporary QA access after use.

Implementation review and release approval are separate. The earlier standalone design proposal is not part of this application branch or release.
