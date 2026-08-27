// 세션 만료 신호가 queryClient 어댑터를 통해 실제로 발신되는지 행동 수준으로 검증한다.
// 어댑터 내부(query.meta 배선·판정 조건)는 건드리지 않고, 구독→쿼리 실패→발신 여부만 관찰한다.

import { afterEach, describe, expect, test, vi } from "vitest";
import { HttpError, makeQueryClient } from "@/shared/api";
import { onSessionExpired } from "@/shared/lib";

const AUTH_GUARDED = { authGuarded: true } as const;
const UNAUTHORIZED = 401;

const unsubscribes: Array<() => void> = [];

afterEach(() => {
  for (const unsubscribe of unsubscribes) unsubscribe();

  unsubscribes.length = 0;
});

function subscribe(listener: () => void): void {
  unsubscribes.push(onSessionExpired(listener));
}

describe("세션 만료 신호 — queryClient 어댑터를 통한 실패 흐름", () => {
  test("이전에 성공한 인증 쿼리가 401 을 받으면 만료 신호가 발신된다", async () => {
    const queryClient = makeQueryClient();
    const onExpired = vi.fn();
    subscribe(onExpired);

    let shouldFail = false;
    const queryFn = () => {
      if (shouldFail) throw new HttpError(UNAUTHORIZED, "세션 만료");

      return { authenticated: true };
    };

    await queryClient.fetchQuery({
      queryKey: ["session"],
      queryFn,
      meta: AUTH_GUARDED,
      retry: false,
    });

    shouldFail = true;
    await queryClient
      .fetchQuery({
        queryKey: ["session"],
        queryFn,
        meta: AUTH_GUARDED,
        retry: false,
        staleTime: 0,
      })
      .catch(() => {});

    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  test("첫 로드에서 받은 401 은(이전 데이터 없음) 만료가 아니다", async () => {
    const queryClient = makeQueryClient();
    const onExpired = vi.fn();
    subscribe(onExpired);

    await queryClient
      .fetchQuery({
        queryKey: ["first-load"],
        queryFn: () => {
          throw new HttpError(UNAUTHORIZED, "세션 만료");
        },
        meta: AUTH_GUARDED,
        retry: false,
      })
      .catch(() => {});

    expect(onExpired).not.toHaveBeenCalled();
  });

  test("인증 가드가 아닌 쿼리의 401 은 이전 데이터가 있어도 만료가 아니다", async () => {
    const queryClient = makeQueryClient();
    const onExpired = vi.fn();
    subscribe(onExpired);

    let shouldFail = false;
    const queryFn = () => {
      if (shouldFail) throw new HttpError(UNAUTHORIZED, "세션 만료");

      return { authenticated: true };
    };

    await queryClient.fetchQuery({
      queryKey: ["public"],
      queryFn,
      retry: false,
    });

    shouldFail = true;
    await queryClient
      .fetchQuery({
        queryKey: ["public"],
        queryFn,
        retry: false,
        staleTime: 0,
      })
      .catch(() => {});

    expect(onExpired).not.toHaveBeenCalled();
  });
});
