import { describe, expect, it } from 'vitest';
import { HttpResponse, http } from 'msw';
import { server } from '@/shared/test/msw/server';
import { getProducts } from './products.api';

// 0단계 경계 확인 — 앱 코드의 fetch를 바꿔치기하지 않고도
// 브라우저 환경에서 나가는 상대 경로 요청을 MSW가 가로채는지 확인한다.
describe('getProducts의 모킹 경계', () => {
  it('브라우저 환경에서 상대 경로로 요청하고 MSW가 그 요청을 가로챈다', async () => {
    let requestedUrl = '';
    server.use(
      http.get('/api/products', ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json({
          products: [],
          categories: [],
          totalCount: 0,
          page: 1,
          pageSize: 12,
        });
      }),
    );

    await getProducts({ category: 'casual', page: 2 });

    expect(requestedUrl).toBe(
      'http://localhost:3000/api/products?category=casual&page=2',
    );
  });

  it('응답 형식이 계약과 다르면 InvalidResponseError로 바꾼다', async () => {
    server.use(
      http.get('/api/products', () => HttpResponse.json({ items: [] })),
    );

    await expect(getProducts()).rejects.toThrow(
      '상품 목록 응답 형식이 올바르지 않습니다.',
    );
  });
});
