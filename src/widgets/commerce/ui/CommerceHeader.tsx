import Link from "next/link";
import { CommerceHeaderCounts } from "./CommerceHeaderCounts";
import { CommerceHeaderAuth } from "./CommerceHeaderAuth";
import { PrefetchCategoryLink } from "@/features/category-select";
import styles from "./CommerceHeader.module.css";

// 로그인 상태는 루트 layout 이 쿠키로 읽어 context 로 내려준다(→ CommerceHeaderAuth 가 useSession 으로 소비).
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
