import { environmentManager } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getQueryClient } from './get-query-client';

beforeEach(() => {
  environmentManager.setIsServer(() => true);
});

describe('서버 QueryClient 정책', () => {
  it('호출마다 새 QueryClient를 만든다', () => {
    expect(getQueryClient()).not.toBe(getQueryClient());
  });

  it('실패한 query를 재시도하지 않는다', async () => {
    const queryFn = vi.fn().mockRejectedValue(new Error('조회 실패'));

    await expect(
      getQueryClient().fetchQuery({
        queryKey: ['server-query'],
        queryFn,
        retryDelay: 0,
      }),
    ).rejects.toThrow('조회 실패');
    expect(queryFn).toHaveBeenCalledTimes(1);
  });
});
