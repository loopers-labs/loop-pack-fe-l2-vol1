import { describe, expect, it } from 'vitest';
import { delay, http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { apiResponseResult } from './response';

/* AI-generated : Week 7 Part 2 — fetch 원문 에러("Failed to fetch")가 사용자에게 그대로 노출되던 문제를 고치면서,
   (a) 네트워크 실패는 읽을 수 있는 문구로 바뀌고 (b) 서버가 준 메시지는 그대로 쓰이며
   (c) 취소(AbortError)는 변환되지 않고 그대로 전파되는지를 고정한다 */
describe('apiResponseResult', () => {
  it('네트워크 자체가 실패하면 원문 대신 읽을 수 있는 문구로 바꾼다', async () => {
    server.use(http.get('*/api/products', () => HttpResponse.error()));

    await expect(apiResponseResult('/api/products')).rejects.toThrow(
      '네트워크에 연결하지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.',
    );
  });

  it('취소(AbortError)는 문구를 바꾸지 않고 그대로 다시 던진다', async () => {
    server.use(
      http.get('*/api/products', async () => {
        await delay('infinite');
        return HttpResponse.json({});
      }),
    );
    const controller = new AbortController();
    const request = apiResponseResult('/api/products', controller.signal);

    controller.abort();

    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('서버가 실패 응답에 메시지를 담아주면 그 메시지를 그대로 쓴다', async () => {
    server.use(
      http.get('*/api/products', () =>
        HttpResponse.json({ message: '상품 목록을 불러오지 못했습니다.' }, { status: 500 }),
      ),
    );

    await expect(apiResponseResult('/api/products')).rejects.toThrow(
      '상품 목록을 불러오지 못했습니다.',
    );
  });

  it('실패 응답의 본문을 파싱하지 못해도 기본 문구로 대체한다', async () => {
    server.use(http.get('*/api/products', () => new HttpResponse('not-json', { status: 500 })));

    await expect(apiResponseResult('/api/products')).rejects.toThrow(
      '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    );
  });

  it('성공하면 응답 본문을 그대로 반환한다', async () => {
    server.use(http.get('*/api/products', () => HttpResponse.json({ totalCount: 30 })));

    await expect(apiResponseResult('/api/products')).resolves.toEqual({ totalCount: 30 });
  });
});
