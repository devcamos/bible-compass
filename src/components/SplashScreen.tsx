"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
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

function subscribeSplashGate() {
  return () => {};
}

function getSplashGateSnapshot(): boolean {
  return alreadySeen();
}

function getSplashGateServerSnapshot(): boolean {
  return false;
}

export function SplashScreen() {
  const seen = useSyncExternalStore(
    subscribeSplashGate,
    getSplashGateSnapshot,
    getSplashGateServerSnapshot,
  );
  const [phase, setPhase] = useState<Phase>("show");

  useEffect(() => {
    if (seen) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const hold = reduceMotion ? 0 : HOLD_MS;
    const fade = reduceMotion ? 0 : FADE_MS;

    const fadeTimer = window.setTimeout(() => {
      if (!reduceMotion) setPhase("fade");
    }, hold);

    const goneTimer = window.setTimeout(() => {
      markSeen();
      setPhase("gone");
    }, hold + fade);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(goneTimer);
    };
  }, [seen]);

  if (seen || phase === "gone") return null;

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
