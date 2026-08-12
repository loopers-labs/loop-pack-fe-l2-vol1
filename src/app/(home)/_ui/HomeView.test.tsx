import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { HomeResponse } from '../_api/homeQueryOptions';

const { prefetchRoute } = vi.hoisted(() => ({ prefetchRoute: vi.fn() }));

vi.mock('next/navigation', () => ({
  default: {},
  useRouter: () => ({ prefetch: prefetchRoute }),
}));

const { HomeView } = await import('./HomeView');

const HOME_RESPONSE: HomeResponse = {
  banner: { title: '배너 제목', description: '배너 설명', image: '/images/banner.jpg' },
  categories: [
    { id: 'digital', name: '디지털' },
    { id: 'fashion', name: '패션' },
  ],
  popularProducts: [],
  newProducts: [],
};

function renderHomeView() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const prefetchQuery = vi.spyOn(queryClient, 'prefetchQuery');
  render(
    <QueryClientProvider client={queryClient}>
      <HomeView />
    </QueryClientProvider>,
  );
  return { prefetchQuery };
}

describe('HomeView 카테고리 링크', () => {
  beforeEach(() => {
    prefetchRoute.mockClear();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(HOME_RESPONSE), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('첫 렌더만으로는 라우트를 프리페치하지 않는다', async () => {
    renderHomeView();
    await screen.findByRole('link', { name: '디지털' });

    expect(prefetchRoute).not.toHaveBeenCalled();
  });

  it('hover하면 그 카테고리의 라우트와 목록 데이터를 함께 예열한다', async () => {
    const { prefetchQuery } = renderHomeView();
    const link = await screen.findByRole('link', { name: '디지털' });

    // React는 mouseenter를 mouseover 위임으로 합성하므로 mouseOver로 onMouseEnter를 깨운다.
    fireEvent.mouseOver(link);

    await waitFor(() => expect(prefetchRoute).toHaveBeenCalledTimes(1));
    expect(prefetchQuery).toHaveBeenCalledTimes(1);
  });

  it('프리페치 대상 경로가 링크의 href와 정확히 같다', async () => {
    renderHomeView();
    const link = await screen.findByRole('link', { name: '패션' });

    // React는 mouseenter를 mouseover 위임으로 합성하므로 mouseOver로 onMouseEnter를 깨운다.
    fireEvent.mouseOver(link);

    await waitFor(() => expect(prefetchRoute).toHaveBeenCalledTimes(1));
    const prefetchedPath = prefetchRoute.mock.calls[0][0] as string;
    expect(link.getAttribute('href')).toBe(prefetchedPath);
    expect(prefetchedPath).toBe('/products?category=fashion');
  });
});
