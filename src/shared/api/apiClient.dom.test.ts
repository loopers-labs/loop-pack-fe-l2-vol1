import { HttpError } from '@/shared/api/httpError';
import { server } from '@/test/server';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { apiClient } from './apiClient';

/**
 * 401 인터셉터 — 공개 경로 (통합)
 *
 * 여기서 보는 것은 "리다이렉트하지 않는다"는 절반뿐이다.
 * 만료(보호 경로에서 받은 401)는 이 파일에 없다. 그 결과는 전체 페이지 이동이라
 * jsdom 이 따라가지 않아 사용자가 보는 화면이 만들어지지 않고, 억지로 확인하려면
 * window.location 을 통째로 갈아끼워 브라우저를 흉내 내야 한다. 그렇게 만든 단언은
 * "사용자가 무엇을 보는가"가 아니라 "코드가 어디로 보내려 했는가"라서,
 * 이동이 실제로 일어나는지는 아무것도 말해주지 않는다.
 *
 * 그래서 만료 흐름은 4단계 E2E(expired 시나리오 노브)로 올렸다. 브라우저가 실제로
 * 이동한 뒤 로그인 화면의 만료 안내를 읽는 것이 그 동작의 유일한 정직한 검증이다.
 *
 * jsdom 기본 경로는 / 라 아래 테스트는 별도 조작 없이 공개 경로 조건에 있다.
 */
describe('공개 경로에서 401 을 받으면', () => {
  it('로그인 화면으로 보내지 않고 401 을 호출부에 그대로 돌려준다', async () => {
    server.use(http.get('/api/orders', () => HttpResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 })));

    const error = await apiClient.get('/orders').then(
      () => null,
      (thrown: unknown) => thrown,
    );

    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({ status: 401, message: '로그인이 필요합니다.' });
  });
});
