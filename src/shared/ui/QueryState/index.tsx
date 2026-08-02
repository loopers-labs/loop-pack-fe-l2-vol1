import type { UseQueryResult } from '@tanstack/react-query';

type QueryStateProps<TData> = {
  /** useQuery의 반환값 */
  query: UseQueryResult<TData>;
  /** 에러 발생 시 렌더할 화면 */
  renderError: (error: Error) => React.ReactNode;
  /** 성공 시 data를 받아 렌더할 화면 */
  children: (data: TData) => React.ReactNode;
};

/* AI-generated : week06-fsd.md 9단계 기준 — renderLoading 제거. keepPreviousData + SSR prefetch로
   isPending 분기가 구조상 거의 도달 불가능해, 로딩 UI는 route loading.tsx가 전담한다 */
export function QueryState<TData>({ query, renderError, children }: QueryStateProps<TData>) {
  if (query.isPending) return null;
  if (query.isError) return renderError(query.error);
  return children(query.data);
}
