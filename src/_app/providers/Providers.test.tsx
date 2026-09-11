import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Providers } from "./Providers";
import { initAnalytics, registerProviders, setCommonProperties } from "@/analytics/logger";

vi.mock("@/analytics/logger", () => ({
  initAnalytics: vi.fn(),
  registerProviders: vi.fn(),
  setCommonProperties: vi.fn(),
}));

vi.mock("@tanstack/react-query-devtools", () => ({
  ReactQueryDevtools: () => null,
}));

describe("Providers analytics", () => {
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.history.replaceState(null, "", "/");
  });

  it("앱 client provider에서 analytics provider와 공통 프로퍼티를 초기화한다", async () => {
    window.history.replaceState(null, "", "/products?category=goods");

    render(
      <Providers>
        <div>children</div>
      </Providers>,
    );

    await waitFor(() => {
      expect(registerProviders).toHaveBeenCalledWith([
        expect.objectContaining({ name: "console" }),
      ]);
    });
    expect(setCommonProperties).toHaveBeenCalledOnce();
    expect(initAnalytics).toHaveBeenCalledOnce();

    const getCommonProperties = vi.mocked(setCommonProperties).mock.calls[0]?.[0];

    expect(getCommonProperties?.()).toMatchObject({
      device: "desktop",
      path: "/products?category=goods",
    });
    expect(getCommonProperties?.()).toHaveProperty("sessionId");
    expect(getCommonProperties?.()).toHaveProperty("ts");
  });
});
