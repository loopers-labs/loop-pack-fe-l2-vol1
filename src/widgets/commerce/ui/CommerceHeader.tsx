import Link from "next/link";
import { cookies } from "next/headers";
import { CommerceHeaderCounts } from "./CommerceHeaderCounts";
import { CommerceHeaderAuth } from "./CommerceHeaderAuth";
import { PrefetchCategoryLink } from "@/features/category-select";
import { readSessionToken } from "@/app/api/_data/auth";
import { SESSION_COOKIE } from "@/app/api/_data/auth-cookies";
import styles from "./CommerceHeader.module.css";

// 서버에서 세션 쿠키의 서명·만료를 검증해 초기 HTML 에 로그인 상태를 담는다(JS 실행 전에도 로그인 여부가 보임).
// cookies() 를 헤더 단위로 읽으므로 헤더가 붙는 라우트만 동적이 되고, 헤더 없는 라우트(perf-lab 등)는 정적으로
// 남는다 — 루트 layout 에서 읽으면 전 라우트가 동적이 되어 정적 예산이 무너진다.
// readSessionToken(_data) 직접 import 는 /api 왕복 없이 렌더 시점에 검증해야 하는 서버 전용 코드라 proxy 와
// 같은 예외다.
export async function CommerceHeader() {
  const cookieStore = await cookies();
  const user = readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  const initialUser = user
    ? { id: user.id, name: user.name, email: user.email }
    : null;

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
        <CommerceHeaderAuth initialUser={initialUser} />
      </nav>
    </header>
  );
}
