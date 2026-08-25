import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { UseQueryResult } from '@tanstack/react-query';
import { QueryState } from './index';

function makeQuery<TData>(overrides: Partial<UseQueryResult<TData>>): UseQueryResult<TData> {
  return {
    isPending: false,
    isError: false,
    data: undefined,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  } as UseQueryResult<TData>;
}

/* AI-generated : Week 7 Part 2 — QueryState가 renderInlineError를 받았을 때, 직전 성공 데이터가 있으면
   목록을 유지한 채 인라인 에러만 추가로 보여주고, 직전 데이터가 없으면 기존처럼 renderError로 전체 교체하는지
   확인한다 */
describe('QueryState — 갱신 실패 시 직전 데이터 유지', () => {
  it('데이터 없이 최초 실패하면 renderError로 전체 교체한다', () => {
    const query = makeQuery<string>({ isError: true, error: new Error('최초 실패') });

    render(
      <QueryState
        query={query}
        renderError={(error) => <p role="alert">{error.message}</p>}
        renderInlineError={() => <p>인라인 에러</p>}
      >
        {(data) => <p>{data}</p>}
      </QueryState>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('최초 실패');
    expect(screen.queryByText('인라인 에러')).toBeNull();
  });

  it('직전 성공 데이터가 있는 상태에서 실패하면 목록을 유지한 채 인라인 에러를 추가로 보여준다', () => {
    const query = makeQuery<string>({ data: '기존 목록' });
    const { rerender } = render(
      <QueryState
        query={query}
        renderError={(error) => <p role="alert">{error.message}</p>}
        renderInlineError={(error) => <p>인라인: {error.message}</p>}
      >
        {(data) => <p>{data}</p>}
      </QueryState>,
    );

    expect(screen.getByText('기존 목록')).toBeInTheDocument();

    const failedQuery = makeQuery<string>({
      data: undefined,
      isError: true,
      error: new Error('갱신 실패'),
    });

    rerender(
      <QueryState
        query={failedQuery}
        renderError={(error) => <p role="alert">{error.message}</p>}
        renderInlineError={(error) => <p>인라인: {error.message}</p>}
      >
        {(data) => <p>{data}</p>}
      </QueryState>,
    );

    expect(screen.getByText('기존 목록')).toBeInTheDocument();
    expect(screen.getByText('인라인: 갱신 실패')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('renderInlineError를 넘기지 않으면 직전 데이터가 있어도 항상 전체 교체한다(기존 동작 유지)', () => {
    const query = makeQuery<string>({ data: '기존 목록' });
    const { rerender } = render(
      <QueryState query={query} renderError={(error) => <p role="alert">{error.message}</p>}>
        {(data) => <p>{data}</p>}
      </QueryState>,
    );

    const failedQuery = makeQuery<string>({
      data: undefined,
      isError: true,
      error: new Error('갱신 실패'),
    });

    rerender(
      <QueryState query={failedQuery} renderError={(error) => <p role="alert">{error.message}</p>}>
        {(data) => <p>{data}</p>}
      </QueryState>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('갱신 실패');
    expect(screen.queryByText('기존 목록')).toBeNull();
  });
});
