import { SKIN_TONES, withSkinTone } from "@/lib/skin-tone";

/** CSS selects the saved tone before hydration, including on server-rendered pages. */
export function EmojiIcon({ icon }: { icon: string }) {
  if (withSkinTone(icon, "default") === withSkinTone(icon, "dark")) {
    return <span aria-hidden="true">{icon}</span>;
  }
  return (
    <span aria-hidden="true" className="bc-emoji">
      {SKIN_TONES.map((tone) => (
        <span key={tone.id} data-icon-tone={tone.id}>{withSkinTone(icon, tone.id)}</span>
      ))}
    </span>
  );
}
