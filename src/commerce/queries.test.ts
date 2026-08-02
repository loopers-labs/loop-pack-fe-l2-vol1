import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { useQuery } from "@tanstack/react-query";
import { cleanup, render } from "../../mocks/render";
import { homeQueryOptions, productListQueryOptions } from "./queries";
import type { ProductListQuery } from "./api/types";

afterEach(cleanup);

const baseQuery: ProductListQuery = {
  q: "",
  category: "all",
  sort: "latest",
  page: 1,
  pageSize: 12,
};

function HomeQueryProbe() {
  useQuery(homeQueryOptions());
  return null;
}

function EmptyProbe() {
  return null;
}

describe("homeQueryOptions", () => {
  it("queryKey·queryFn·staleTime·gcTime을 한 정의에 담는다", () => {
    const options = homeQueryOptions();

    expect(options.queryKey).toEqual(["commerce", "home"]);
    expect(typeof options.queryFn).toBe("function");
    expect(options.staleTime).toBe(300000);
    expect(options.gcTime).toBe(600000);
  });
});

describe("productListQueryOptions", () => {
  it("queryKey·queryFn·staleTime·gcTime을 한 정의에 담는다", () => {
    const options = productListQueryOptions(baseQuery);

    expect(typeof options.queryFn).toBe("function");
    expect(options.staleTime).toBe(60000);
    expect(options.gcTime).toBe(300000);
  });

  it("q·category·sort·page·pageSize 5개 필드를 모두 queryKey에 반영한다", () => {
    const baseKey = productListQueryOptions(baseQuery).queryKey;

    expect(productListQueryOptions({ ...baseQuery, q: "shoes" }).queryKey).not.toEqual(baseKey);
    expect(productListQueryOptions({ ...baseQuery, category: "casual" }).queryKey).not.toEqual(
      baseKey,
    );
    expect(productListQueryOptions({ ...baseQuery, sort: "popular" }).queryKey).not.toEqual(
      baseKey,
    );
    expect(productListQueryOptions({ ...baseQuery, page: 2 }).queryKey).not.toEqual(baseKey);
    expect(productListQueryOptions({ ...baseQuery, pageSize: 24 }).queryKey).not.toEqual(baseKey);
  });
});

describe("mocks/render과의 캐시 격리", () => {
  it("render() 호출마다 새 QueryClient를 만든다 — 2회차 캐시는 비어 있다", () => {
    const first = render(createElement(HomeQueryProbe));
    expect(first.queryClient.getQueryCache().getAll().length).toBeGreaterThan(0);

    const second = render(createElement(EmptyProbe));
    expect(second.queryClient.getQueryCache().getAll().length).toBe(0);
  });

  it("QueryClient의 기본 retry는 false다", () => {
    const { queryClient } = render(createElement(HomeQueryProbe));

    expect(queryClient.getDefaultOptions().queries?.retry).toBe(false);
  });
});
