import { useState } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';

type QueryStateProps<TData> = {
  /** useQuery의 반환값 */
  query: UseQueryResult<TData>;
  /** 에러 발생 시 렌더할 화면(직전 성공 데이터가 없을 때만 쓰인다) */
  renderError: (error: Error) => React.ReactNode;
  /** 직전 성공 데이터가 남아있는 상태에서 에러가 나면, 목록은 유지한 채 이 자리에 인라인 에러를 추가로 보여준다. 생략하면 항상 renderError로 전체 교체한다 */
  renderInlineError?: (error: Error, onRetry: () => void) => React.ReactNode;
  /** 성공 시 data를 받아 렌더할 화면 */
  children: (data: TData) => React.ReactNode;
};

/* AI-generated : week06-fsd.md 9단계 기준 — renderLoading 제거. keepPreviousData + SSR prefetch로
   isPending 분기가 구조상 거의 도달 불가능해, 로딩 UI는 route loading.tsx가 전담한다 */
/* AI-generated : Week 7 Part 2 — 갱신 실패 시 isError가 되는 순간 data가 undefined가 되어 무조건 renderError로
   전체 교체되던 문제. 마지막 성공 데이터를 state로 기억해두고(렌더 중 조건부 setState — ref 대신 이 패턴을 쓴
   이유는 렌더 중 ref 읽기/쓰기를 금지하는 react-hooks/refs 린트 규칙 때문), 에러가 나도 그 데이터가 있으면
   목록은 그대로 두고 renderInlineError로 인라인 에러만 추가한다. 직전 성공 데이터가 아예 없는 최초 실패는
   기존처럼 전체 교체한다 */
export function QueryState<TData>({
  query,
  renderError,
  renderInlineError,
  children,
}: QueryStateProps<TData>) {
  const [lastData, setLastData] = useState<TData | undefined>(undefined);
  if (query.data !== undefined && query.data !== lastData) {
    setLastData(query.data);
  }

  if (query.isPending) return null;

  if (query.isError) {
    if (lastData !== undefined && renderInlineError) {
      return (
        <>
          {renderInlineError(query.error, () => query.refetch())}
          {children(lastData)}
        </>
      );
    }
    return renderError(query.error);
  }

  return children(query.data);
}
