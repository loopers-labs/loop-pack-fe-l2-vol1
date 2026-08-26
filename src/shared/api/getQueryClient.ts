import { environmentManager, QueryClient } from '@tanstack/react-query';
import { makeQueryClient } from './queryClient';

// [AI] 서버/클라이언트 양쪽에서 QueryClient를 얻는 통일된 진입점.
// 브라우저에서는 모듈 스코프 싱글턴을 재사용하고, 서버에서는 매 요청 새 인스턴스를 만든다.
// useState로 관리하면 서스펜션 시 React가 인스턴스를 버리면서 하이드레이션된 캐시가 날아갈 수 있다.
// 공식 문서 권장 패턴.
// 'use client' 파일(QueryProvider)에 두면 서버 컴포넌트/generateMetadata에서 import할 수 없으므로
// 별도의 서버 안전 모듈로 뺀다.
let browserQueryClient: QueryClient | undefined;

export const getQueryClient = (): QueryClient => {
  if (environmentManager.isServer()) {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
};
