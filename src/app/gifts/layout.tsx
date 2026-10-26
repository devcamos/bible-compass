import type { ReactNode } from "react";
import styles from "./gifts.module.css";

export default function GiftsLayout({ children }: { children: ReactNode }) {
  return <div className={styles.reader}>{children}</div>;
}
