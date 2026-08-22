"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

const THEME_KEY = "bible-compass-theme";
const THEME_EVENT = "bible-compass-theme";

type Theme = "light" | "dark";

function readTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "dark" ? "dark" : "light";
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(THEME_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(THEME_EVENT, onStoreChange);
  };
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore private-mode storage failures */
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function SiteHeader() {
  const pathname = usePathname();
  const onHowToUse = pathname === "/how-to-use";
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as Theme);
  const nextTheme: Theme = theme === "dark" ? "light" : "dark";

  return (
    <header className="flex items-center justify-between gap-3 py-4">
      <Link
        href="/"
        className="flex min-h-11 items-center gap-2.5 text-[1.05rem] font-medium text-copper no-underline"
        aria-current={pathname === "/" ? "page" : undefined}
      >
        <span aria-hidden="true">📖</span>
        Bible Compass
      </Link>
      <nav aria-label="Primary" className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border bg-card text-foreground"
          aria-label={
            theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
          }
          onClick={() => applyTheme(nextTheme)}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
        <Link
          href="/how-to-use"
          aria-current={onHowToUse ? "page" : undefined}
          className={
            onHowToUse
              ? "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-copper bg-card px-3.5 text-sm font-medium text-copper no-underline"
              : "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-sm font-medium text-foreground no-underline"
          }
        >
          <span aria-hidden="true">🧭</span>
          How to use
        </Link>
      </nav>
    </header>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
