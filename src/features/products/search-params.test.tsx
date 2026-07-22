import { renderHook, waitFor } from '@testing-library/react';
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing';
import type { ReactNode } from 'react';
import { expect, it, vi } from 'vitest';

import { usePageClamp } from './search-params';

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
