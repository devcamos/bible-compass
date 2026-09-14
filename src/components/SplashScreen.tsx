"use client";

import { useEffect } from "react";

const SPLASH_KEY = "bible-compass-splash-seen";
const HOLD_MS = 900;
const FADE_MS = 420;
/** Keep splash while JS/CSS settle; show recovery if the shell never becomes ready. */
const READY_WAIT_MS = 8000;

function markSeen() {
  document.documentElement.setAttribute("data-splash", "seen");
  try {
    sessionStorage.setItem(SPLASH_KEY, "1");
  } catch {
    /* ignore private-mode storage failures */
  }
}

function clearShellFault() {
  document.documentElement.removeAttribute("data-shell");
}

function getSplashEl() {
  return document.getElementById("bc-splash");
}

function shellHasContent(): boolean {
  const main = document.getElementById("main");
  return Boolean(main && main.childElementCount > 0);
}

function showShellFault(message: string) {
  const root = document.documentElement;
  root.setAttribute("data-shell", "fault");
  root.removeAttribute("data-splash");
  const el = getSplashEl();
  if (!el) return;
  el.classList.remove("bc-splash--fade");
  el.setAttribute("aria-busy", "false");
  const copy = el.querySelector("[data-splash-recover-copy]");
  if (copy) copy.textContent = message;
  const kicker = el.querySelector(".bc-splash__kicker");
  if (kicker) kicker.textContent = "Still with you";
}

function finishSplash(el: HTMLElement, reduceMotion: boolean) {
  if (document.documentElement.getAttribute("data-shell") === "fault") return;

  el.setAttribute("aria-busy", "false");

  if (reduceMotion) {
    markSeen();
    return;
  }

  el.classList.add("bc-splash--fade");
  window.setTimeout(() => {
    if (document.documentElement.getAttribute("data-shell") === "fault") {
      el.classList.remove("bc-splash--fade");
      return;
    }
    markSeen();
  }, FADE_MS);
}

/**
 * Hides the static #bc-splash node only after the app shell looks ready.
 * Uses data-* attributes (not className) so React hydration cannot wipe shell state.
 */
export function SplashController() {
  useEffect(() => {
    const el = getSplashEl();
    if (!el) return;

    const retry = el.querySelector<HTMLButtonElement>("[data-splash-retry]");
    const onRetry = () => {
      window.location.reload();
    };
    retry?.addEventListener("click", onRetry);

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let finished = false;
    let holdTimer: number | undefined;
    let readyTimer: number | undefined;
    let faultTimer: number | undefined;

    const tryFinish = () => {
      if (finished) return;
      if (document.documentElement.getAttribute("data-shell") === "fault") return;
      if (!shellHasContent()) return;
      if (document.readyState === "loading") return;
      finished = true;
      window.clearTimeout(faultTimer);
      clearShellFault();
      finishSplash(el, reduceMotion);
    };

    const onAssetError = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const tag = target.tagName;
      if (tag !== "SCRIPT" && tag !== "LINK") return;
      finished = true;
      showShellFault(
        "Something needed for this page did not finish loading. Check your connection, then try again.",
      );
    };

    const onOffline = () => {
      if (
        finished &&
        document.documentElement.getAttribute("data-splash") === "seen"
      ) {
        return;
      }
      showShellFault(
        "You appear to be offline. Bible Compass will be here when the connection returns.",
      );
    };

    window.addEventListener("error", onAssetError, true);
    window.addEventListener("offline", onOffline);
    document.addEventListener("readystatechange", tryFinish);

    if (document.documentElement.getAttribute("data-splash") === "seen") {
      finished = true;
    } else {
      holdTimer = window.setTimeout(tryFinish, HOLD_MS);
      readyTimer = window.setTimeout(tryFinish, HOLD_MS + 200);
      faultTimer = window.setTimeout(() => {
        if (finished) return;
        if (shellHasContent() && navigator.onLine !== false) {
          tryFinish();
          return;
        }
        showShellFault(
          navigator.onLine === false
            ? "You appear to be offline. Bible Compass will be here when the connection returns."
            : "This page is taking longer than usual. Check your connection, then try again.",
        );
      }, READY_WAIT_MS);

      if (!navigator.onLine) onOffline();
    }

    return () => {
      window.clearTimeout(holdTimer);
      window.clearTimeout(readyTimer);
      window.clearTimeout(faultTimer);
      window.removeEventListener("error", onAssetError, true);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("readystatechange", tryFinish);
      retry?.removeEventListener("click", onRetry);
    };
  }, []);

  return null;
}
