"use client";

import { useEffect } from "react";

const SPLASH_KEY = "bible-compass-splash-seen";
const HOLD_MS = 900;
const FADE_MS = 420;

function markSeen() {
  document.documentElement.classList.add("splash-seen");
  try {
    sessionStorage.setItem(SPLASH_KEY, "1");
  } catch {
    /* ignore private-mode storage failures */
  }
}

function getSplashEl() {
  return document.getElementById("bc-splash");
}

/**
 * Dismisses the static #bc-splash node painted by the root layout.
 * Visibility on first paint is handled by splashBootstrap + CSS, not React.
 */
export function SplashController() {
  useEffect(() => {
    const el = getSplashEl();
    if (!el) return;

    if (document.documentElement.classList.contains("splash-seen")) {
      el.remove();
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const hold = reduceMotion ? 0 : HOLD_MS;
    const fade = reduceMotion ? 0 : FADE_MS;

    const fadeTimer = window.setTimeout(() => {
      if (!reduceMotion) el.classList.add("bc-splash--fade");
    }, hold);

    const goneTimer = window.setTimeout(() => {
      markSeen();
      el.remove();
    }, hold + fade);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(goneTimer);
    };
  }, []);

  return null;
}
