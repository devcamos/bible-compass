import type { Metadata } from "next";
import { FeedbackWorkspace } from "@/components/FeedbackWorkspace";

export const metadata: Metadata = {
  title: "Give feedback",
  description: "Report a bug, suggest an improvement or rate your experience using Bible Compass.",
  robots: { index: false, follow: false },
};

export default function FeedbackPage() {
  const commit = process.env.VERCEL_GIT_COMMIT_SHA ?? null;
  return <FeedbackWorkspace clientCommit={commit && /^[a-f0-9]{40}$/i.test(commit) ? commit : null} />;
}
