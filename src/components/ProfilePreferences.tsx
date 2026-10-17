"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { DailyVersePreferences } from "@/components/DailyVersePreferences";
import { isSkinTone, SKIN_TONE_KEY, SKIN_TONES, withSkinTone, type SkinTone } from "@/lib/skin-tone";

const THEME_KEY = "bible-compass-theme";
const PREFERENCES_EVENT = "bible-compass-preferences";
type Theme = "light" | "dark";

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.storageArea !== window.localStorage) return;
    if (event.key === THEME_KEY || event.key === null) {
      const value = event.newValue;
      document.documentElement.dataset.theme = value === "light" || value === "dark" ? value : systemTheme();
    }
    if (event.key === SKIN_TONE_KEY || event.key === null) {
      document.documentElement.dataset.skinTone = isSkinTone(event.newValue) ? event.newValue : "default";
    }
    onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(PREFERENCES_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(PREFERENCES_EVENT, onChange);
  };
}

function readPreferences() {
  const root = document.documentElement;
  const tone = root.dataset.skinTone ?? null;
  return `${root.dataset.theme === "dark" ? "dark" : "light"}:${isSkinTone(tone) ? tone : "default"}`;
}

function savePreference(key: string, attribute: string, value: string) {
  document.documentElement.setAttribute(attribute, value);
  try {
    localStorage.setItem(key, value);
  } catch {
    // Preferences still work for this visit when browser storage is unavailable.
  }
  window.dispatchEvent(new Event(PREFERENCES_EVENT));
}

export function ProfilePreferences() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const toneId = useId();
  const snapshot = useSyncExternalStore(subscribe, readPreferences, () => "light:default");
  const [theme, tone] = snapshot.split(":") as [Theme, SkinTone];

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    const onToggle = () => {
      document.body.style.overflow = dialog?.open ? "hidden" : previousOverflow;
    };
    dialog?.addEventListener("toggle", onToggle);
    return () => {
      dialog?.removeEventListener("toggle", onToggle);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <>
      <button
        type="button"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border bg-card text-foreground"
        aria-label="Open profile"
        aria-haspopup="dialog"
        title="Your profile"
        onClick={() => dialogRef.current?.showModal()}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21v-2a8 8 0 0 1 16 0v2" strokeLinecap="round" />
        </svg>
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="bc-profile fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto overscroll-contain rounded-3xl border border-border bg-background p-0 text-foreground shadow-2xl backdrop:bg-ink/60"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-background px-5 py-4">
          <div>
            <p className="bc-kicker m-0 mb-1">Make it yours</p>
            <h2 id={titleId} className="bc-title m-0 text-2xl">Your Profile</h2>
          </div>
          <button type="button" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-xl" aria-label="Close" onClick={() => dialogRef.current?.close()}><span aria-hidden="true">×</span></button>
        </header>
        <div className="space-y-5 p-5">
          <section aria-label="Appearance" className="space-y-4">
          <div><h3 className="m-0 text-sm font-semibold">Appearance</h3><p className="mb-0 mt-1 text-sm text-muted-foreground">A little more like you, on this device.</p></div>
          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className="mb-2 text-sm text-muted-foreground">Icon skin tone</legend>
            <div className="grid grid-cols-3 gap-2">
              {SKIN_TONES.map((option) => (
                <label key={option.id} className={`relative flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border bg-card px-1 py-2 text-center text-xs leading-tight transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-copper ${tone === option.id ? "border-copper ring-1 ring-copper" : "border-border"}`}>
                  <input type="radio" name={toneId} value={option.id} checked={tone === option.id} className="sr-only" onChange={() => savePreference(SKIN_TONE_KEY, "data-skin-tone", option.id)} />
                  <span aria-hidden="true" className="text-2xl">{withSkinTone("🙏", option.id)}</span>
                  <span>{option.label}</span>
                  {tone === option.id ? <span aria-hidden="true" className="absolute right-1.5 top-1 text-copper">✓</span> : null}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
            <span className="text-sm font-medium"><span aria-hidden="true" className="mr-2">☾</span>Dark mode</span>
            <span className="relative flex items-center"><input type="checkbox" role="switch" checked={theme === "dark"} className="peer sr-only" onChange={(event) => savePreference(THEME_KEY, "data-theme", event.target.checked ? "dark" : "light")} /><span aria-hidden="true" className="h-6 w-11 rounded-full bg-border transition-colors peer-checked:bg-copper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-copper" /><span aria-hidden="true" className="absolute left-1 h-4 w-4 rounded-full bg-cream transition-transform peer-checked:translate-x-5" /></span>
          </label>
          </section>
          <DailyVersePreferences />
        </div>
      </dialog>
    </>
  );
}
