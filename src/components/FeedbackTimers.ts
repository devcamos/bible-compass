"use client";

import { useEffect, useState } from "react";

/** UI countdown only; retrying the network request always requires another user action. */
export function useFeedbackRetryWait(retryAt: number | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (retryAt === null) return;
    const tick = () => { const current = Date.now(); setNow(current); if (current >= retryAt) window.clearInterval(timer); };
    const timer = window.setInterval(tick, 1000);
    tick();
    return () => window.clearInterval(timer);
  }, [retryAt]);
  return retryAt === null ? 0 : Math.max(0, Math.ceil((retryAt - now) / 1000));
}
