// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from "vitest";
import { isValidElement, type ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import RootLayout from "@/app/layout";

vi.mock("@vercel/analytics/next", () => ({ Analytics: () => null }));
afterEach(() => vi.unstubAllEnvs());

function analyticsCount(node: ReactNode): number {
  if (Array.isArray(node)) return node.reduce((sum, child) => sum + analyticsCount(child), 0);
  if (!isValidElement<{ children?: ReactNode }>(node)) return 0;
  return Number(node.type === Analytics) + analyticsCount(node.props.children);
}

it.each([[undefined, 0], ["development", 0], ["preview", 1], ["production", 1]] as const)(
  "loads hosted analytics only on Vercel Preview/Production (%s)", (surface, count) => {
    vi.stubEnv("VERCEL_ENV", surface);
    expect(analyticsCount(RootLayout({ children: <p>Reader</p>, params: Promise.resolve({}) }))).toBe(count);
  },
);
