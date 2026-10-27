"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { feedbackOrigin } from "@/lib/feedback/client-draft";
import styles from "./Feedback.module.css";

export function FeedbackEntry() {
  const pathname = usePathname();
  if (pathname === "/feedback") return null;
  return <Link id="give-feedback" href={`/feedback?from=${encodeURIComponent(feedbackOrigin(pathname))}`} prefetch={false}
    className={styles.entry}>Give feedback</Link>;
}
