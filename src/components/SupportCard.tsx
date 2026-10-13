import { getSupportUrl } from "@/lib/site";

/**
 * Quiet, optional support invite shown after a topic reading is finished.
 * Personal sole-trader link only — no company branding.
 */
export function SupportCard() {
  const href = getSupportUrl();

  return (
    <aside
      className="mt-10 rounded-2xl border border-border bg-card p-5"
      aria-labelledby="support-heading"
    >
      <h2 id="support-heading" className="bc-title bc-heading m-0 mb-2">
        Keep this free to find
      </h2>
      <p className="m-0 mb-4 text-[1.02rem] leading-7 text-muted-foreground">
        If this reading helped, you can get me a coffee. Totally optional; nothing here
        depends on it.
      </p>
      <a
        href={href}
        className="bc-btn bc-btn--quiet gap-1.5 whitespace-nowrap"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span>Get me a coffee</span>
        <span aria-hidden="true">↗</span>
      </a>
    </aside>
  );
}
