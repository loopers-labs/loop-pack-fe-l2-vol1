import { connection } from 'next/server';
import ProductListSection from './ProductListSection';

// AI 생성: week-07 2단계 — 본문 server prefetch(prefetchQuery + HydrationBoundary)를 제거하고 목록
// 데이터의 소유권을 클라이언트 useQuery로 일원화했다. 서버가 1.5초를 통째로 기다린 뒤 문서를 응답하는
// 대신, 셸을 즉시 내려보내고 데이터 없는 최초 진입은 그리드 스켈레톤이 담당한다.
// 근거와 감수한 비용은 docs/work/week-07/product-list-pending-design.md 참고.
//
// connection()으로 요청 시점 렌더링을 명시해 라우트를 동적으로 유지한다 — nuqs가 서버 렌더에서 URL을
// 읽어야 SSR이 그린 화면과 hydrate 이후의 query key가 같은 필터를 가리킨다.
export default async function ProductListPage() {
  await connection();

  return <ProductListSection />;
}
