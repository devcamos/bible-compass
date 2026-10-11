export const SKIN_TONES = [
  { id: "default", label: "Default", modifier: "" },
  { id: "light", label: "Light", modifier: "🏻" },
  { id: "medium-light", label: "Medium light", modifier: "🏼" },
  { id: "medium", label: "Medium", modifier: "🏽" },
  { id: "medium-dark", label: "Medium dark", modifier: "🏾" },
  { id: "dark", label: "Dark", modifier: "🏿" },
] as const;

export type SkinTone = (typeof SKIN_TONES)[number]["id"];
export const SKIN_TONE_KEY = "bible-compass-skin-tone-v1";

export function isSkinTone(value: string | null): value is SkinTone {
  return SKIN_TONES.some((tone) => tone.id === value);
}

/** Only single human emoji with Unicode skin-tone support are modified. */
export function withSkinTone(icon: string, tone: SkinTone): string {
  const base = icon.replace(/\p{Emoji_Modifier}/gu, "");
  if (!/^\p{Emoji_Modifier_Base}\uFE0F?$/u.test(base)) return icon;
  const modifier = SKIN_TONES.find((option) => option.id === tone)!.modifier;
  return modifier ? base.replace(/\uFE0F/g, "") + modifier : base;
}

export const skinToneBootstrap = `(function(){var root=document.documentElement;var tone='default';try{var saved=localStorage.getItem('${SKIN_TONE_KEY}');if(${JSON.stringify(SKIN_TONES.map((option) => option.id))}.indexOf(saved)!==-1)tone=saved;}catch(e){}root.setAttribute('data-skin-tone',tone);})();`;
