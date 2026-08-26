import Link from "next/link";
import { CommerceHeaderCounts } from "./CommerceHeaderCounts";
import { CommerceHeaderAuth } from "./CommerceHeaderAuth";
import { PrefetchCategoryLink } from "@/features/category-select";
import styles from "./CommerceHeader.module.css";

export function CommerceHeader() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brandLink}>
        Commerce
      </Link>
      <nav className={styles.nav}>
        <PrefetchCategoryLink category="all" href="/products">
          상품
        </PrefetchCategoryLink>
        <CommerceHeaderCounts />
        <CommerceHeaderAuth />
      </nav>
    </header>
  );
}
