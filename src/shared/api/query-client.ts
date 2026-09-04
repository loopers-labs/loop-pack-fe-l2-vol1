import { QueryClient } from '@tanstack/react-query';
import { InvalidResponseError, UnauthorizedError } from './errors';

// 클라이언트 쿼리 정책의 단일 소스 — 화면(QueryProvider)과 통합 테스트가 같은 것을 쓴다.
// 테스트가 자기만의 QueryClient를 새로 만들면 retry·throwOnError가 프로덕션과 달라져
// "실패 화면이 뜬다"를 검증해도 실제 화면의 실패 경로와는 다른 것을 재게 된다.
// (서버 prefetch용 get-query-client는 기본값 없는 별도 계약이므로 이 정책을 쓰지 않는다.)
export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 20,
        // 계약 위반은 재시도해도 같으므로 0회, 그 외(HTTP·네트워크)는 1회만 —
        // 기본값(3회·지수 백오프)은 실패 인지까지 7초+ 걸렸다(6주차 RFC 0단계 실측).
        // 401도 재시도 대상이 아니다 — 세션이 없는데 다시 물어도 같다 (9주차 RFC D5).
        retry: (failureCount, error) =>
          !(error instanceof InvalidResponseError) &&
          !(error instanceof UnauthorizedError) &&
          failureCount < 1,
        // 재시도가 의미 있는 오류(HTTP·네트워크)는 결과 영역 인라인에서 처리하고,
        // 계약 위반만 경계(error.tsx)로 던진다 — 6주차 RFC 4단계 표와 일치해야 한다.
        // 401은 화면마다 처리하지 않고 (commerce) 경계 한 곳으로 던진다 (9주차 RFC D5).
        throwOnError: (error) =>
          error instanceof InvalidResponseError ||
          error instanceof UnauthorizedError,
      },
    },
  });
}
