import type { ReactNode } from "react";
import styles from "./psalms.module.css";

export default function PsalmsLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <div className={styles.reader}>{children}</div>;
}
