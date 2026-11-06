// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { runInNewContext } from "node:vm";
import type { ReactElement } from "react";
import { SplashController } from "@/components/SplashScreen";
vi.mock("@vercel/analytics/next", () => ({ Analytics: () => null }));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  delete document.documentElement.dataset.shell;
  delete document.documentElement.dataset.splash;
});

const toolbar = "https://vercel.live/_next-live/feedback/feedback.js";
const cases = [
  ["SCRIPT", toolbar, false],
  ["SCRIPT", `${toolbar}?v=1`, false],
  ["SCRIPT", "/_next/static/chunks/required.js", true],
  ["LINK", "/_next/static/css/required.css", true],
  ["SCRIPT", "https://vercel.live.evil.example/_next-live/feedback/feedback.js", true],
  ["SCRIPT", `${toolbar}.other`, true],
  ["LINK", toolbar, true],
] as const;

it.each(cases)("hydrated shell handles %s %s (fault=%s)", (tag, url, fault) => {
  vi.useFakeTimers();
  document.body.innerHTML = '<div id="bc-splash"></div><main id="main"><p>Reader</p></main>';
  render(<SplashController />);
  const asset = document.createElement(tag.toLowerCase());
  asset.setAttribute(tag === "SCRIPT" ? "src" : "href", url);
  document.body.append(asset);
  asset.dispatchEvent(new Event("error"));
  expect(document.documentElement.dataset.shell === "fault").toBe(fault);
  if (!fault) {
    vi.advanceTimersByTime(2000);
    expect(document.documentElement.dataset.splash).toBe("seen");
  }
});

it.each(cases)("early shell handles %s %s (fault=%s)", async (tag, url, fault) => {
  const { default: RootLayout } = await import("@/app/layout");
  const tree = RootLayout({ children: <p>Reader</p>, params: Promise.resolve({}) });
  type Node = ReactElement<{ children?: Node[]; dangerouslySetInnerHTML?: { __html: string } }>;
  const head = (tree.props.children as Node[])[0];
  const script = head.props.children!.map(node => node.props?.dangerouslySetInnerHTML?.__html).find(code => code?.includes("bible-compass-splash-seen"))!;
  let onError: (event: unknown) => void = () => {};
  const attributes: Record<string, string> = {};
  runInNewContext(script, {
    window: { matchMedia: () => ({ matches: false }), addEventListener: (_: string, callback: typeof onError) => { onError = callback; } },
    sessionStorage: { getItem: () => null },
    document: { documentElement: { setAttribute: (key: string, value: string) => { attributes[key] = value; }, removeAttribute: (key: string) => { delete attributes[key]; } } },
  });
  onError({ target: { tagName: tag, src: url } });
  expect(attributes["data-shell"] === "fault").toBe(fault);
});
