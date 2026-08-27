import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { renderToReadableStream, renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HomePage } from './HomePage';

import { HOME_RESPONSE } from '@tests/msw/fixtures';
import { server } from '@tests/msw/server';

// connection()은 Next 요청 컨텍스트 밖에서 던지므로, 서버 렌더를 검증하려면 이것만은 대체해야 한다.
vi.mock('next/server', () => ({ connection: () => Promise.resolve() }));

// 성공은 기본 핸들러가 맡는다. 여기서는 예외 경로만 덮는다.
const failHome = () =>
  server.use(
    http.get('*/api/home', () =>
      HttpResponse.json(
        { message: '홈 데이터를 불러오지 못했습니다.' },
        { status: 500 },
      ),
    ),
  );

/**
 * 경계 안에서 던진 오류는 Suspense가 삼키고 클라이언트 렌더로 미루므로 HTML만 봐서는 모른다.
 * 서버 렌더 오류는 어느 테스트에서든 실패여야 해서 여기서 바로 던진다.
 */
const renderUntilAllReady = async () => {
  const errors: unknown[] = [];
  const stream = await renderToReadableStream(
    <QueryClientProvider client={new QueryClient()}>
      <HomePage />
    </QueryClientProvider>,
    {
      onError: (error) => {
        errors.push(error);
      },
    },
  );

  await stream.allReady;

  if (errors.length > 0) throw errors[0];

  return new Response(stream).text();
};

describe('HomePage', () => {
  /**
   * 서버 렌더를 검증하는 파일이라 node 환경에서 돈다.
   * 서버의 apiClient는 상대 경로를 해석하지 못해 APP_ORIGIN으로 절대 URL을 만든다.
   */
  beforeEach(() => {
    vi.stubEnv('APP_ORIGIN', 'https://commerce.example');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // renderToStaticMarkup은 셸만 동기로 그린다. 이미지가 여기 있다는 건 조회를 안 기다린다는 뜻이다.
  it('홈 조회 전에도 배너 이미지와 카드를 보여준다', () => {
    const markup = renderToStaticMarkup(<HomePage />);

    expect(markup).toContain('hero-original.jpg');
    expect(markup).toContain('width="3840"');
    expect(markup).toContain('height="2160"');
    expect(markup).toContain('이번 주의 발견');
  });

  it('홈 조회 뒤에는 배너에 이미지와 문구가 함께 보인다', async () => {
    const markup = await renderUntilAllReady();

    expect(markup).toContain('hero-original.jpg');
    expect(markup).toContain('width="3840"');
    expect(markup).toContain('height="2160"');
    expect(markup).toContain(HOME_RESPONSE.banner.title);
    expect(markup).toContain(HOME_RESPONSE.banner.description);
  });

  it('홈 조회가 실패해도 배너 이미지는 남고 문구만 비운다', async () => {
    failHome();

    const markup = await renderUntilAllReady();

    expect(markup).toContain('hero-original.jpg');
    expect(markup).toContain('이번 주의 발견');
    expect(markup).not.toContain(HOME_RESPONSE.banner.title);
  });
});
