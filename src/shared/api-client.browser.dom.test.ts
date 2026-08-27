import { environmentManager } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, it } from 'vitest';

import { apiClient } from './api-client';

import { server } from '@tests/msw/server';

/**
 * 상대 경로는 location이 있어야 실제 요청이 되므로 node가 아닌 jsdom에서 돈다.
 * setIsServer로 브라우저라고 알리는 것만으로는 부족해 api-client.test.ts와 합칠 수 없다.
 */
beforeEach(() => {
  environmentManager.setIsServer(() => false);
});

it('브라우저에서는 APP_ORIGIN을 붙이지 않고 상대 경로 그대로 요청한다', async () => {
  let requestedUrl: string | undefined;

  server.use(
    http.get('*/api/products', ({ request }) => {
      requestedUrl = request.url;

      return HttpResponse.json({});
    }),
  );

  await apiClient('/api/products?page=2');

  expect(requestedUrl).toBe(`${location.origin}/api/products?page=2`);
});
