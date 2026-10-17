import type { ReactNode } from "react";
import styles from "./proverbs.module.css";

export default function ProverbsLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <div className={styles.reader}>{children}</div>;
}
