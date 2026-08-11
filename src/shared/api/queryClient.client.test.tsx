// @vitest-environment jsdom
// Advanced B 요구 2~4 검증

import { afterEach, describe, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import {
  dehydrate,
  HydrationBoundary,
  QueryClientProvider,
  useQuery,
  type DehydratedState,
} from "@tanstack/react-query";
import { getQueryClient, makeQueryClient } from "./queryClient";
import { productQueries } from "@/entities/product";
import type { ProductListParams } from "@/entities/product";
import type { ProductListResponse } from "@/entities/product";
import { installProductListHandler } from "@/__tests__/msw/productListHandler";

const RESPONSE: ProductListResponse = {
  products: [],
  categories: [],
  totalCount: 30,
  page: 1,
  pageSize: 12,
};

const QUERY: ProductListParams = {
  q: "",
  category: "all",
  sort: "latest",
  page: 1,
};

afterEach(cleanup);

describe("getQueryClient — 브라우저(jsdom)", () => {
  test("브라우저에서는 싱글톤을 재사용한다 (렌더마다 새로 만들면 캐시가 초기화됨)", () => {
    expect(getQueryClient()).toBe(getQueryClient());
  });
});

// 클라이언트: 서버와 같은 queryOptions인 productQueries.list 로 useQuery.
function Probe({ query }: { query: ProductListParams }) {
  const { data, isPending } = useQuery(productQueries.list(query));

  if (isPending) return <p>불러오는 중</p>;

  return <p>총 {data?.totalCount}개</p>;
}

// 서버: productQueries로 prefetch 후 dehydrate.
async function prefetchOnServer(
  query: ProductListParams,
): Promise<DehydratedState> {
  const server = makeQueryClient();
  await server.prefetchQuery(productQueries.list(query));

  return dehydrate(server);
}

function renderClient(state: DehydratedState, probeQuery: ProductListParams) {
  render(
    <QueryClientProvider client={makeQueryClient()}>
      <HydrationBoundary state={state}>
        <Probe query={probeQuery} />
      </HydrationBoundary>
    </QueryClientProvider>,
  );
}

describe("서버 prefetch → 클라 컴포넌트 핸드오프", () => {
  // 요구 3 — dehydrate·HydrationBoundary 로 캐시 전달
  test("요구3: dehydrate + HydrationBoundary 가 서버 캐시를 클라이언트에 전달한다", async () => {
    installProductListHandler(() => RESPONSE);
    const state = await prefetchOnServer(QUERY);
    expect(state.queries).toHaveLength(1); // dehydrate 스냅샷에 쿼리가 담긴다

    renderClient(state, QUERY);

    // HydrationBoundary 로 넘어온 데이터가 로딩 없이 바로 보인다
    expect(await screen.findByText("총 30개")).toBeTruthy();
    expect(screen.queryByText("불러오는 중")).toBeNull();
  });

  // 요구 4 — 초기 중복 요청 없음. (요구 2도 함께 커버: 서버가 "같은 팩토리 productQueries.list"로 prefetch 했기에 클라가 같은 조건 useQuery 에서 그 캐시를 재사용한다)
  test("요구4: prefetch 된 조건으로 mount 해도 초기 중복 요청이 없다", async () => {
    // MSW 가 가로챈 요청을 기록한다 — fetcher 를 바꿔치기하지 않고 "몇 번 나갔는지"만 관찰.
    const requests = installProductListHandler(() => RESPONSE);
    const state = await prefetchOnServer(QUERY);
    expect(requests).toHaveLength(1); // 서버 prefetch 로 딱 1번 나갔다

    renderClient(state, QUERY);
    await screen.findByText("총 30개");

    // mount 직후 잠깐 기다려도 추가 요청이 없어야 한다(staleTime 60s 로 fresh)
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(requests).toHaveLength(1);
  });
});
