// AI 생성: week-07 3단계 — 본문 prefetch(homeQueries.detail)와 같은 query factory를 써서 같은
// GET URL·options를 만든다. getQueryClient()는 호출마다 새 인스턴스라 본문과 Query 캐시를 공유하지
// 않는다 — 중복이 사라진다면 같은 render/request의 native fetch memoization 때문이다.
// 조회가 실패하면 페이지별 빈 metadata 대신 root 공통 metadata를 상속하도록 {}를 반환한다.
//
// title은 루트의 title.template로 위임하지 않고 SITE_NAME을 직접 붙인다. app/page.tsx의
// `dynamic = 'force-dynamic'` 아래에서는 루트 title.template이 이 페이지의 문자열 title에
// 자동 적용되지 않음을 production build에서 실측 확인했다(목록 페이지에서는 정상 적용).
// 원인은 Next.js 내부 metadata 누적 로직(단일 레이아웃 트리에서 title 템플릿이 다음 순회로
// 넘어가지 않는 경로)에 있는 것으로 보이나, 자동 병합에 기대는 대신 명시적으로 조합해
// 두 페이지의 title 규칙을 동일하게 보이도록 맞춘다.
import type { Metadata } from 'next';
import { getQueryClient } from '@/shared/api/getQueryClient';
import { commonOpenGraph, SITE_NAME } from '@/shared/config/siteMetadata';
import { homeQueries } from './homeQueries';

export async function generateHomeMetadata(): Promise<Metadata> {
  try {
    const home = await getQueryClient().fetchQuery(homeQueries.detail());

    return {
      title: `${home.banner.title} | ${SITE_NAME}`,
      description: home.banner.description,
      openGraph: {
        ...commonOpenGraph,
        title: home.banner.title,
        description: home.banner.description,
        images: [home.banner.image]
      }
    };
  } catch {
    return {};
  }
}
