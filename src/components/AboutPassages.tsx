import type { ReactNode } from "react";

type AboutPassagesProps = Readonly<{
  /** Visible disclosure label. */
  title?: string;
  /** Full editorial note shown when the disclosure is open. */
  children: ReactNode;
  className?: string;
}>;

/**
 * Collapsible help for curated-selection / catalogue notes.
 * Uses native `<details>` so it is keyboard-accessible, works without JS,
 * and matches existing Bible Compass disclosure DNA (e.g. Proverbs intro).
 */
export function AboutPassages({
  title = "About these passages",
  children,
  className = "mb-4 border-y border-border py-1 text-sm",
}: AboutPassagesProps) {
  return (
    <details className={className} data-about-passages>
      <summary className="cursor-pointer py-2 font-medium">
        <span className="summary-label">{title}</span>
      </summary>
      <div className="pb-3 leading-6 text-muted-foreground" data-about-passages-body>
        {typeof children === "string" ? <p className="m-0">{children}</p> : children}
      </div>
    </details>
  );
}
