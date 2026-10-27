"use client";

import { useEffect } from "react";

/** Focus only a known passage named by this category's explicit return link. */
export function PassageReturnFocus({ passageIds }: { passageIds: readonly string[] }) {
  useEffect(() => {
    let frame: number | undefined;
    function focusPassage() {
      const id = window.location.hash.slice(1);
      if (!passageIds.includes(id)) return;
      const link = document.getElementById(id);
      if (!(link instanceof HTMLAnchorElement)) return;
      const chapter = link.closest("details");
      if (chapter) chapter.open = true;
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        link.focus({ preventScroll: true });
        link.scrollIntoView({ block: "center" });
      });
    }
    focusPassage();
    window.addEventListener("hashchange", focusPassage);
    return () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", focusPassage);
    };
  }, [passageIds]);

  return null;
}
