import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { useQuery } from "@tanstack/react-query";
import { cleanup, render } from "../../../../mocks/render";
import { homeQueryOptions } from "./queries";

afterEach(cleanup);

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
