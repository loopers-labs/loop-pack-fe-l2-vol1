import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { QueryClient, QueryObserver, useQuery } from "@tanstack/react-query";
import { cleanup, render } from "../../../../mocks/render";
import { HttpError } from "../../../shared/api";
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

  it("5xx와 네트워크 오류만 Error Boundary로 전파한다", () => {
    const options = homeQueryOptions();
    const { throwOnError } = options;
    const queryClient = new QueryClient();
    const observer = new QueryObserver(queryClient, options);
    const query = observer.getCurrentQuery();

    expect(typeof throwOnError).toBe("function");
    if (typeof throwOnError !== "function") {
      throw new Error("throwOnError는 predicate여야 합니다.");
    }

    expect(throwOnError(new HttpError(500), query)).toBe(true);
    expect(throwOnError(new HttpError(503), query)).toBe(true);
    expect(throwOnError(new HttpError(404), query)).toBe(false);
    expect(throwOnError(new Error("network unavailable"), query)).toBe(true);
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
