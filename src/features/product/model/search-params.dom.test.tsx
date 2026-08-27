import { act, renderHook, waitFor } from '@testing-library/react';
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing';
import type { ReactNode } from 'react';
import { expect, it, vi } from 'vitest';

import { usePageClamp, useProductListUrlState } from './search-params';

type UrlState = ReturnType<typeof useProductListUrlState>;

const renderUrlState = () => {
  const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();

  const { result } = renderHook(() => useProductListUrlState(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <NuqsTestingAdapter searchParams="?page=1" onUrlUpdate={onUrlUpdate}>
        {children}
      </NuqsTestingAdapter>
    ),
  });

  return { result, onUrlUpdate };
};

const writtenOptions = async (
  onUrlUpdate: ReturnType<typeof renderUrlState>['onUrlUpdate'],
) => {
  await waitFor(() => expect(onUrlUpdate).toHaveBeenCalledOnce());

  return onUrlUpdate.mock.calls[0][0].options;
};

it.each([
  [
    '카테고리를 바꾸면',
    (urlState: UrlState) => urlState.changeCategory('home'),
  ],
  ['정렬을 바꾸면', (urlState: UrlState) => urlState.changeSort('price-asc')],
  ['페이지를 옮기면', (urlState: UrlState) => urlState.changePage(2)],
])('%s 뒤로 가기로 되돌릴 수 있게 push로 쓴다', async (_, operate) => {
  const { result, onUrlUpdate } = renderUrlState();

  act(() => operate(result.current));

  expect((await writtenOptions(onUrlUpdate)).history).toBe('push');
});

it('페이지를 옮기면 맨 위로 스크롤한다', async () => {
  const { result, onUrlUpdate } = renderUrlState();

  act(() => result.current.changePage(2));

  expect((await writtenOptions(onUrlUpdate)).scroll).toBe(true);
});

it('잘못된 정렬값은 유지하고 초과한 page만 마지막 페이지로 replace한다', async () => {
  const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();

  renderHook(() => usePageClamp(3), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <NuqsTestingAdapter
        searchParams="?sort=hack&page=99999"
        onUrlUpdate={onUrlUpdate}
      >
        {children}
      </NuqsTestingAdapter>
    ),
  });

  await waitFor(() => expect(onUrlUpdate).toHaveBeenCalledOnce());

  const update = onUrlUpdate.mock.calls[0][0];

  expect(update.searchParams.get('sort')).toBe('hack');
  expect(update.searchParams.get('page')).toBe('3');
  expect(update.options.history).toBe('replace');
});
