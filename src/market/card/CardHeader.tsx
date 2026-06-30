import { type ReactNode } from "react";

import styles from "./Card.module.css";

export function CardHeader({ children }: { children: ReactNode }) {
  return <header className={styles.header}>{children}</header>;
}
