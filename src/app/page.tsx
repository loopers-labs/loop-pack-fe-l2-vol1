// [AI] 홈 서버 prefetch: 요청마다 QueryClient를 만들어 /api/home을 미리 불러오고,
// dehydrate/HydrationBoundary로 클라이언트에 전달한다.
// 첫 페인트부터 상품이 노출되어 스피너를 없애고 LCP를 개선한다.
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { homeQueries } from '@/features/home/api/queries';
import { HomeContent } from '@/features/home/ui/HomeContent';
import { makeQueryClient } from '@/lib/queryClient';

const Home = async () => {
  // [AI] 요청마다 새 QueryClient. 모듈 스코프 싱글턴을 쓰면 요청 간 캐시가 섞인다.
  const queryClient = makeQueryClient();

  // 클라이언트 useQuery와 같은 팩토리를 써야 query key가 일치해 캐시가 적중한다.
  await queryClient.prefetchQuery(homeQueries.home());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeContent />
    </HydrationBoundary>
  );
};

export default Home;
