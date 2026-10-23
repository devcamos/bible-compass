# Saved pages — design proposal

Status: sample for founder discussion. No app bookmark behavior is implemented. This proposal must not be merged or treated as a Production release before the relevant approval.

Readers can save a reading where they find it and return to it later. The proposed entry is **Your Profile → Saved pages**, keeping the home page compact. A quiet footer link is an alternative for discussion.

## Review the sample

On this branch's Vercel Preview, open `/designs/saved-pages.html`. Choose **Try clickable flow**, save the reading, open Your Profile, then Saved pages. Open a saved item, remove one and try Undo. The toolbar also shows the empty list, light/dark appearance and a simulated storage failure.

The standalone HTML file has no external assets, app API calls, accounts or storage writes. Its fictional items stay in memory and reset on reload. It is a concrete interactive design sample, not an implementation of persistence or an offline library. The reading metadata and exact Psalm verse/chapter links follow the existing BSB convention. The normal reader is unchanged.

## Proposed first version

- A secondary **Save page / Saved** toggle on a topic, book/category or verse reading page. It saves the existing internal destination, not a copy of Scripture.
- One saved-pages list, newest save first, with title and reading context; opening an item returns to its original route.
- **Remove** with **Undo**, plus a useful empty state and an honest save-failure state.
- This browser/device only. Explain that clearing browser data removes the list and that saves do not sync across devices. No account or new permission.
- Existing fonts, palette, reading links, grace wording, profile preferences and reminders remain the basis of the design.

Folders, notes, search, cloud sync and saving full Scripture text are outside this proposed first version.

## Decisions for discussion

1. Is **Your Profile → Saved pages** sufficiently easy to find, or should the entry be a footer link?
2. Does one list on this device meet the initial need?

## Implementation acceptance after design agreement

Use canonical allowlisted internal reading routes and validate stored shape/version/size. Keep query strings, fragments and unsupported routes out of saved destinations. Handle unavailable/corrupt storage without claiming a save succeeded or losing the current reading. Preserve the saved key through the app's update lifecycle. Verify no duplicates, stable order, removal/Undo, exact destinations, empty/error states, keyboard focus/announcements, narrow light/dark layouts and the existing PWA/reminder flow.

Persistence, cross-tab behavior, reload/app-update behavior and physical-device accessibility are not proven by this memory-only prototype. Remove the standalone preview artifact from the public reader build before a future implementation is released, retaining the agreed design in documentation. Separate explicit PR/release approval remains required.
