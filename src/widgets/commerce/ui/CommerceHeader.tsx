import Link from "next/link";
import { CommerceHeaderCounts } from "./CommerceHeaderCounts";
import { PrefetchCategoryLink } from "@/features/category-select";
import styles from "@/components/commerce/commerce.module.css";

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
      </nav>
    </header>
  );
}
