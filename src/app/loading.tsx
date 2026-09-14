export default function Loading() {
  return (
    <div className="bc-shell-loading" aria-busy="true" aria-live="polite">
      <div className="bc-shell-loading__card">
        <div className="bc-shell-loading__line bc-shell-loading__line--title" />
        <div className="bc-shell-loading__line" />
        <div className="bc-shell-loading__line bc-shell-loading__line--short" />
      </div>
      <p className="bc-shell-loading__label">Opening this path…</p>
    </div>
  );
}
