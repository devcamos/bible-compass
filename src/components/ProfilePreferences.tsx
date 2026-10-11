"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
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
        className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-border bg-background p-0 text-foreground backdrop:bg-ink/50"
      >
        <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 id={titleId} className="bc-title bc-heading m-0">Your Profile</h2>
          <button type="button" className="bc-btn bc-btn--quiet" onClick={() => dialogRef.current?.close()}>Close</button>
        </header>
        <div className="space-y-4 p-4">
          <p className="m-0 text-sm leading-5 text-muted-foreground">Choose how Bible Compass looks on this device.</p>
          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className="mb-2 font-medium">Icon skin tone</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SKIN_TONES.map((option) => (
                <label key={option.id} className={`flex min-h-14 cursor-pointer items-center gap-2 rounded-xl border bg-card px-2.5 py-1.5 text-sm leading-tight focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-copper ${tone === option.id ? "border-copper" : "border-border"}`}>
                  <input type="radio" name={toneId} value={option.id} checked={tone === option.id} className="shrink-0 accent-copper" onChange={() => savePreference(SKIN_TONE_KEY, "data-skin-tone", option.id)} />
                  <span><span aria-hidden="true" className="block text-xl">{withSkinTone("🙏", option.id)}</span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
            <span className="font-medium">Dark mode</span>
            <input type="checkbox" checked={theme === "dark"} className="h-5 w-5 accent-copper" onChange={(event) => savePreference(THEME_KEY, "data-theme", event.target.checked ? "dark" : "light")} />
          </label>
        </div>
      </dialog>
    </>
  );
}
