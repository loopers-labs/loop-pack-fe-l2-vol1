import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToReadableStream, renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HomePage } from './HomePage';

import { getQueryClient } from '@/shared/get-query-client';

vi.mock('next/server', () => ({ connection: () => Promise.resolve() }));

const HOME_RESPONSE = {
  banner: {
    title: '매일 새롭게 발견하는 취향',
    description: '지금 가장 사랑받는 상품을 만나보세요.',
    image: '/images/products/p6.jpg',
  },
  categories: [{ id: 'living', name: '리빙' }],
  popularProducts: [],
  newProducts: [],
};

const mockHome = (response: { ok: boolean; body: unknown }) =>
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: response.ok,
      status: response.ok ? 200 : 500,
      json: () => Promise.resolve(response.body),
    }),
  );

const renderUntilAllReady = async () => {
  const stream = await renderToReadableStream(
    <QueryClientProvider client={new QueryClient()}>
      <HomePage />
    </QueryClientProvider>,
  );

  await stream.allReady;

  return new Response(stream).text();
};

describe('HomePage', () => {
  // getQueryClient는 브라우저 환경에서 싱글턴이라 앞 회차의 결과가 다음 회차로 새어 나간다.
  beforeEach(() => getQueryClient().clear());

  // renderToStaticMarkup은 셸만 동기로 그린다. 이미지가 여기 있다는 건 조회를 안 기다린다는 뜻이다.
  it('홈 조회 전에도 배너 이미지와 카드를 보여준다', () => {
    const markup = renderToStaticMarkup(<HomePage />);

    expect(markup).toContain('hero-original.jpg');
    expect(markup).toContain('width="3840"');
    expect(markup).toContain('height="2160"');
    expect(markup).toContain('이번 주의 발견');
  });

  it('홈 조회 뒤에는 배너에 이미지와 문구가 함께 보인다', async () => {
    mockHome({ ok: true, body: HOME_RESPONSE });

    const markup = await renderUntilAllReady();

    expect(markup).toContain('hero-original.jpg');
    expect(markup).toContain('width="3840"');
    expect(markup).toContain('height="2160"');
    expect(markup).toContain('매일 새롭게 발견하는 취향');
    expect(markup).toContain('지금 가장 사랑받는 상품을 만나보세요.');
  });

  it('홈 조회가 실패해도 배너 이미지는 남고 문구만 비운다', async () => {
    mockHome({
      ok: false,
      body: { message: '홈 데이터를 불러오지 못했습니다.' },
    });

    const markup = await renderUntilAllReady();

    expect(markup).toContain('hero-original.jpg');
    expect(markup).toContain('이번 주의 발견');
    expect(markup).not.toContain('매일 새롭게 발견하는 취향');
    expect(markup).not.toContain('Switched to client rendering');
  });
});
