import { Suspense } from "react";
import { connection } from "next/server";
import { getHome } from "@/services/commerce";
import { CommerceHeader } from "@/components/commerce/CommerceHeader";
import { HomeContent } from "@/components/commerce/HomeContent";
import styles from "@/components/commerce/commerce.module.css";

export default function HomePage() {
  return (
    <main className={styles.page}>
      <CommerceHeader />
      <Suspense
        fallback={<p className={styles.status}>홈 데이터를 불러오는 중…</p>}
      >
        <HomeData />
      </Suspense>
    </main>
  );
}

// 홈은 서버에서 자기 /api/home 을 fetch 한다. 정적 prerender 는 빌드타임에 페이지를 실행하는데
// 그 시점엔 라우트 서버가 안 떠 있어 self-fetch 가 ECONNREFUSED 로 실패한다 → 요청당 렌더가 필요하다.
// connection() - 이 라우트를 정적 -> 동적으로 바뀌게 하여 빌드 prerender 를 막는다.
// https://nextjs.org/docs/app/api-reference/functions/connection
async function HomeData() {
  await connection();
  const home = await getHome();

  return <HomeContent home={home} />;
}
