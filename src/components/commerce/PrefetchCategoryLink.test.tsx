// @vitest-environment jsdom
// Advanced C — 상품 목록으로 이동하기 전 prefetch: hover/focus 시점에 prefetch처리

import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrefetchCategoryLink } from "./PrefetchCategoryLink";
import { buildDefaultProductListQuery } from "@/hooks/productListSearchParams";
import { productQueries } from "@/queries/products";

afterEach(cleanup);

function renderLink(queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <PrefetchCategoryLink category="home" href="/products?category=home">
        홈
      </PrefetchCategoryLink>
    </QueryClientProvider>,
  );
}

describe("PrefetchCategoryLink", () => {
  test("hover 시 목록 초기조건을 목록 페이지와 '같은 queryKey' 로 prefetch 한다", () => {
    const queryClient = new QueryClient();
    const prefetchSpy = vi
      .spyOn(queryClient, "prefetchQuery")
      .mockResolvedValue(undefined);

    renderLink(queryClient);
    fireEvent.mouseEnter(screen.getByRole("link", { name: "홈" }));

    const expectedKey = productQueries.list(
      buildDefaultProductListQuery({ category: "home" }),
    ).queryKey;

    expect(prefetchSpy).toHaveBeenCalledTimes(1);
    expect(prefetchSpy.mock.calls[0][0].queryKey).toEqual(expectedKey);
  });

  test("focus 시에도 prefetch 한다(키보드 사용자)", () => {
    const queryClient = new QueryClient();
    const prefetchSpy = vi
      .spyOn(queryClient, "prefetchQuery")
      .mockResolvedValue(undefined);

    renderLink(queryClient);
    fireEvent.focus(screen.getByRole("link", { name: "홈" }));

    expect(prefetchSpy).toHaveBeenCalledTimes(1);
  });
});
