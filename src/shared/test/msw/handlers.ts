import { http, HttpResponse } from 'msw';
import { makeHome, makeProductList } from '../fixtures';

// 기본 핸들러에는 성공 경로만 둔다.
// 실패·지연·빈 결과는 그 동작을 검증하는 테스트가 server.use()로 그 자리에서 덮는다 —
// 기본값에 예외를 섞으면 "이 테스트가 무엇을 전제하는가"가 파일 밖으로 새어 나간다.
export const handlers = [
  http.get('/api/products', ({ request }) => {
    const params = new URL(request.url).searchParams;
    const page = Number(params.get('page') ?? '1');
    const pageSize = Number(params.get('pageSize') ?? '12');

    return HttpResponse.json(makeProductList({ page, pageSize }));
  }),

  http.get('/api/home', () => HttpResponse.json(makeHome())),
];
