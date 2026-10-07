"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ProphetBook } from "@/content/prophets";
import { scriptureReference, scriptureUrl } from "@/lib/scripture-mapping.mjs";

function SummaryContent({ book }: { book: ProphetBook }) {
  return (
    <div className="space-y-5">
      <p className="m-0 leading-7">{book.summary}</p>
      <div>
        <h3 className="bc-title bc-heading m-0 mb-3 leading-snug">Key Themes</h3>
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {book.themes.map((theme) => <li key={theme} className="rounded-full border border-border bg-card px-3 py-1 text-sm leading-6">{theme}</li>)}
        </ul>
      </div>
      <p className="m-0 rounded-xl border-l-4 border-copper bg-card p-4 leading-7">{book.takeaway}</p>
      <div className="space-y-3">
        <a className="text-link block leading-6" href={scriptureUrl(book.passage)} target="_blank" rel="noreferrer">Read {scriptureReference(book.passage)} (NIV)</a>
        <a className="text-link block text-sm leading-6" href={book.sourceUrl} target="_blank" rel="noreferrer">Book overview at BibleProject</a>
      </div>
    </div>
  );
}

export function ProphetBookList({ books }: { books: readonly ProphetBook[] }) {
  const [selectedBook, setSelectedBook] = useState<ProphetBook | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!selectedBook || !dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedBook]);

  return (
    <div className="mt-3">
      <p className="m-0 mb-3 text-sm leading-6 text-muted-foreground">Select a book for a short summary.</p>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {books.map((book) => (
          <li key={book.id}>
            <button type="button" className="bc-btn bc-btn--quiet" aria-haspopup="dialog" onClick={() => setSelectedBook(book)}>{book.title}</button>
          </li>
        ))}
      </ul>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="fixed inset-0 m-auto h-fit max-h-[85dvh] w-[90vw] max-w-md overflow-y-auto rounded-2xl border border-border bg-background p-5 text-foreground backdrop:bg-ink/50"
        onClose={() => setSelectedBook(null)}
        onPointerUp={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.currentTarget.close();
        }}
      >
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="bc-title bc-heading m-0 mb-1 leading-snug">{selectedBook?.title ?? "Book Summary"}</h2>
            {selectedBook ? <p className="m-0 text-sm leading-6 text-muted-foreground">{selectedBook.group === "major-prophets" ? "Major Prophets" : "Minor Prophets"}</p> : null}
          </div>
          <button type="button" className="bc-btn bc-btn--quiet shrink-0" onClick={() => dialogRef.current?.close()}>Close</button>
        </header>
        {selectedBook ? <SummaryContent book={selectedBook} /> : null}
      </dialog>
      <noscript>
        <div className="mt-4 space-y-3">
          {books.map((book) => <details key={book.id} className="rounded-xl border border-border p-4"><summary className="font-medium"><span className="summary-label">{book.title}</span></summary><div className="mt-4"><SummaryContent book={book} /></div></details>)}
        </div>
      </noscript>
    </div>
  );
}
