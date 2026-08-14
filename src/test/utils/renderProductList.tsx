// [AI] ProductList 통합 테스트용 공용 render helper (week-08 2단계, 커밋 3).
// NuqsTestingAdapter(URL 상태) + QueryClientProvider(서버 상태)를 묶어서
// items 4-7, 8-10, 12 테스트가 같은 조립 환경을 쓰게 한다.
// 주의 1: 앱의 QueryProvider는 브라우저에서 모듈 싱글턴 QueryClient를 재사용한다
// (getQueryClient.ts). 테스트가 이걸 그대로 쓰면 캐시(staleTime 30초)가
// 테스트 사이로 새어 들어 격리가 깨진다 — 그래서 렌더링마다 새 클라이언트를 만든다.
// 주의 2: retry: false로 덮어쓴다 (week-08.md:167). 앱의 retry: 1은 사용자에겐
// 일시적 오류 자가복구라 이롭지만, 테스트에선 (a) 1초 백오프 때문에 에러 UI가
// findBy의 기본 타임아웃(1초)을 넘겨 실패하고 (b) 자동 재시도가 MSW 순차 응답의
// 성공을 소비해 "실패 → 에러 UI → 사용자 재시도" 시나리오 자체를 없애버린다.
// 첫 실패 = 즉시 에러 상태여야 에러/재시도 테스트가 빠르고 결정적으로 돈다.
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { ProductList } from '@/_pages/product/ui/ProductList';

// [AI] 테스트 전용 QueryClient 팩토리. makeQueryClient()에서 retry만 덮어쓴다.
const makeTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

export const renderProductList = (searchParams = '') =>
  render(
    <NuqsTestingAdapter searchParams={searchParams} hasMemory>
      <QueryClientProvider client={makeTestQueryClient()}>
        <ProductList />
      </QueryClientProvider>
    </NuqsTestingAdapter>
  );
