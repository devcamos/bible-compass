"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ProphetBook } from "@/content/prophets";
import { scriptureReference, scriptureUrl } from "@/lib/scripture-mapping.mjs";

function SummaryContent({ book }: { book: ProphetBook }) {
  return (
    <div className="flex flex-col gap-6 text-base leading-7">
      <p className="m-0">{book.summary}</p>
      <div>
        <h3 className="bc-title bc-heading m-0 mb-3 leading-snug">Key Themes</h3>
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {book.themes.map((theme) => (
            <li key={theme} className="rounded-full border border-border bg-card px-3 py-1 text-sm leading-6">
              {theme}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="bc-title bc-heading m-0 mb-3 leading-snug">For Everyday Life</h3>
        <p className="m-0 rounded-xl border-l-4 border-copper bg-card p-4">{book.takeaway}</p>
      </div>
      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <a className="text-link leading-6" href={scriptureUrl(book.passage)} target="_blank" rel="noreferrer">
          Read {scriptureReference(book.passage)} (NIV)
        </a>
        <a className="text-link text-sm leading-6" href={book.sourceUrl} target="_blank" rel="noreferrer">
          Book overview at BibleProject
        </a>
      </div>
    </div>
  );
}

export function ProphetBookList({ books }: { books: readonly ProphetBook[] }) {
  const [selectedBook, setSelectedBook] = useState<ProphetBook | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!selectedBook || !dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!dialog.open) dialog.showModal();
    if (contentRef.current) contentRef.current.scrollTop = 0;
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
            <button type="button" className="bc-btn bc-btn--quiet" aria-haspopup="dialog" onClick={() => setSelectedBook(book)}>
              {book.title}
            </button>
          </li>
        ))}
      </ul>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-2xl border border-border bg-background p-0 text-foreground open:flex open:flex-col backdrop:bg-ink/50"
        onClose={() => setSelectedBook(null)}
        onPointerUp={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.currentTarget.close();
        }}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0 break-words">
            <h2 id={titleId} className="bc-title bc-heading m-0 mb-1 leading-snug">{selectedBook?.title ?? "Book Summary"}</h2>
            {selectedBook ? (
              <p className="m-0 text-sm leading-6 text-muted-foreground">
                {selectedBook.group === "major-prophets" ? "Major Prophets" : "Minor Prophets"}
              </p>
            ) : null}
          </div>
          <button type="button" className="bc-btn bc-btn--quiet shrink-0" onClick={() => dialogRef.current?.close()}>
            Close
          </button>
        </header>
        <div
          ref={contentRef}
          role="region"
          aria-label={`${selectedBook?.title ?? "Book"} summary`}
          tabIndex={0}
          className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain break-words p-5 [scrollbar-gutter:stable] focus-visible:-outline-offset-4"
        >
          {selectedBook ? <SummaryContent book={selectedBook} /> : null}
        </div>
      </dialog>
      <noscript>
        <div className="mt-4 space-y-3">
          {books.map((book) => (
            <details key={book.id} className="rounded-xl border border-border p-4">
              <summary className="font-medium"><span className="summary-label">{book.title}</span></summary>
              <div className="mt-4"><SummaryContent book={book} /></div>
            </details>
          ))}
        </div>
      </noscript>
    </div>
  );
}
