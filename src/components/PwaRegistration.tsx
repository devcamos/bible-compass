"use client";

import { useEffect } from "react";
import { startAppUpdateChecks, type AppUpdateHost } from "@/lib/app-updates";
import { feedbackReloadSafe } from "@/lib/feedback/client-draft";
import { savedPagesReloadSafe } from "@/lib/saved-pages";

function readerReloadSafe() { return feedbackReloadSafe() && savedPagesReloadSafe(); }

export function PwaRegistration({ commit, surface }: Readonly<{ commit: string | null; surface: string | null }>) {
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!readerReloadSafe()) event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    if ("serviceWorker" in navigator && window.isSecureContext) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
        // Installation/push failure must never interrupt the reader.
      });
    }
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, []);

  useEffect(() => {
    const host: AppUpdateHost = {
      isVisible: () => document.visibilityState === "visible",
      isOnline: () => navigator.onLine,
      canReload: readerReloadSafe,
      now: () => Date.now(),
      fetch: (url, init) => fetch(url, init),
      storage: {
        getItem: (key) => window.sessionStorage.getItem(key),
        setItem: (key, value) => window.sessionStorage.setItem(key, value),
      },
      reload: () => window.location.reload(),
      on: (event, listener) => {
        const target = event === "visibilitychange" ? document : window;
        target.addEventListener(event, listener);
        return () => target.removeEventListener(event, listener);
      },
      setTimer: (callback, ms) => window.setTimeout(callback, ms),
      clearTimer: (handle) => window.clearTimeout(handle as number | undefined),
    };
    return startAppUpdateChecks({ commit, surface }, host);
  }, [commit, surface]);
  return null;
}
