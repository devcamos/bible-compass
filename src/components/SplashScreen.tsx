"use client";

import { useEffect, useState } from "react";
import { SITE_NAME } from "@/lib/site";

const SPLASH_KEY = "bible-compass-splash-seen";
const HOLD_MS = 900;
const FADE_MS = 420;

type Phase = "show" | "fade" | "gone";

function alreadySeen(): boolean {
  if (typeof document === "undefined") return false;
  if (document.documentElement.classList.contains("splash-seen")) return true;
  try {
    return sessionStorage.getItem(SPLASH_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen() {
  document.documentElement.classList.add("splash-seen");
  try {
    sessionStorage.setItem(SPLASH_KEY, "1");
  } catch {
    /* ignore private-mode storage failures */
  }
}

export function SplashScreen() {
  const [phase, setPhase] = useState<Phase>("show");

  useEffect(() => {
    if (alreadySeen()) {
      setPhase("gone");
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      markSeen();
      setPhase("gone");
      return;
    }

    const fadeTimer = window.setTimeout(() => {
      setPhase("fade");
    }, HOLD_MS);

    const goneTimer = window.setTimeout(() => {
      markSeen();
      setPhase("gone");
    }, HOLD_MS + FADE_MS);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(goneTimer);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      className={`bc-splash${phase === "fade" ? " bc-splash--fade" : ""}`}
      role="status"
      aria-live="polite"
      aria-busy={phase === "show"}
    >
      <div className="bc-splash__mark" aria-hidden="true">
        📖
      </div>
      <p className="bc-splash__title bc-title">{SITE_NAME}</p>
      <p className="bc-splash__kicker bc-kicker">A quiet start</p>
    </div>
  );
}
