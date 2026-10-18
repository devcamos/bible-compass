type ScriptureCreditProps = Readonly<{
  /** Optional extra context after the NIV / Bible Gateway credit. */
  note?: string;
  className?: string;
}>;

/**
 * Minimal always-visible Scripture attribution.
 * Full editorial selection notes live in {@link AboutPassages}; this keeps
 * the translation and host credit on-screen for honesty and link clarity.
 */
export function ScriptureCredit({
  note,
  className = "mb-4 text-sm leading-6 text-muted-foreground",
}: ScriptureCreditProps) {
  return (
    <p className={className} data-scripture-credit>
      Scripture links open the NIV on Bible Gateway
      {note ? `. ${note}` : "."}
    </p>
  );
}
