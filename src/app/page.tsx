// [AI] 홈 서버 prefetch: 요청마다 QueryClient를 만들어 /api/home을 미리 불러오고,
// dehydrate/HydrationBoundary로 클라이언트에 전달한다.
// 첫 페인트부터 상품이 노출되어 스피너를 없애고 LCP를 개선한다.
import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { commonOpenGraph } from './layout';
import { homeQueries } from '@/_pages/home/api/queries';
import { HomeContent } from '@/_pages/home/ui/HomeContent';
import { getQueryClient } from '@/shared/api/getQueryClient';

// [AI] 홈 metadata: 본문 prefetch와 같은 query factory(homeQueries.home)로 banner를 가져와
// title·description·OG image를 채운다. fetch 실패 시 빈 객체를 돌려 root 고정값이 상속되게 한다.
// query failure 대응은 edge case 단계에서 별도 검증(line 138 뒤).
export const generateMetadata = async (): Promise<Metadata> => {
  const queryClient = getQueryClient();
  try {
    const data = await queryClient.fetchQuery(homeQueries.home());
    return {
      title: data.banner.title,
      description: data.banner.description,
      openGraph: {
        ...commonOpenGraph,
        title: data.banner.title,
        description: data.banner.description,
        images: [{ url: data.banner.image }],
      },
    };
  } catch {
    return {};
  }
};

const Home = async () => {
  // getQueryClient()는 서버에서 매 요청 새 인스턴스를 반환한다.
  // 모듈 스코프 싱글턴을 쓰면 요청 간 캐시가 섞인다.
  const queryClient = getQueryClient();

  // 클라이언트 useQuery와 같은 팩토리를 써야 query key가 일치해 캐시가 적중한다.
  await queryClient.prefetchQuery(homeQueries.home());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeContent />
    </HydrationBoundary>
  );
};

export default Home;
