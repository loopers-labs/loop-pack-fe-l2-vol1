import { afterEach, describe, expect, it } from "vitest";
import { resetAnalyticsForTest } from "@/analytics/logger";
import type { AnalyticsProvider, EventProperties } from "@/analytics/provider";
import {
  identifyUser,
  resetSharedAnalyticsForTest,
  resetUser,
  setupAnalytics,
  trackEvent,
} from "./analytics";
import { loginFromReturnTo } from "./login-from";

type Recorded =
  | { type: "track"; event: string; properties: EventProperties }
  | { type: "identify"; userId: string }
  | { type: "reset" };

const createRecorder = () => {
  const recorded: Recorded[] = [];
  const provider: AnalyticsProvider = {
    name: "recorder",
    initialize: () => {},
    track: (event, properties) => recorded.push({ type: "track", event, properties }),
    identify: (userId) => recorded.push({ type: "identify", userId }),
    reset: () => recorded.push({ type: "reset" }),
  };
  return { provider, recorded };
};

describe("shared/analytics", () => {
  afterEach(() => {
    resetAnalyticsForTest();
    resetSharedAnalyticsForTest();
    window.sessionStorage.clear();
  });

  it("모든 이벤트에 sessionId·device·ts 를 붙이고, 로그인 전에는 userId 를 붙이지 않는다", async () => {
    const { provider, recorded } = createRecorder();
    await setupAnalytics([provider]);

    trackEvent("cart_add", { productId: "p1", quantity: 1 });

    expect(recorded).toHaveLength(1);
    const [first] = recorded;
    expect(first.type === "track" && first.properties).toMatchObject({
      productId: "p1",
      quantity: 1,
      sessionId: expect.stringMatching(/^s_[a-z0-9]{4}$/),
      device: expect.stringMatching(/^(mobile|tablet|desktop)$/),
      ts: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    });
    expect(first.type === "track" && "userId" in first.properties).toBe(false);
  });

  it("sessionId 는 같은 탭에서 유지된다", async () => {
    const { provider, recorded } = createRecorder();
    await setupAnalytics([provider]);

    trackEvent("login_start", { from: "cart" });
    trackEvent("login_success", { from: "cart" });

    const ids = recorded.map((r) => (r.type === "track" ? r.properties.sessionId : null));
    expect(ids[0]).toBe(ids[1]);
    expect(window.sessionStorage.getItem("analytics.sessionId")).toBe(ids[0]);
  });

  it("identify 이후의 이벤트에만 userId 가 붙고, reset 이후에는 떨어진다", async () => {
    const { provider, recorded } = createRecorder();
    await setupAnalytics([provider]);

    identifyUser("u3");
    trackEvent("order_start", { productIds: ["p1"], itemCount: 1 });
    resetUser();
    trackEvent("login_start", { from: "direct" });

    expect(recorded.map((r) => r.type)).toEqual(["identify", "track", "reset", "track"]);
    expect(recorded[1]).toMatchObject({ properties: { userId: "u3" } });
    expect(recorded[3].type === "track" && "userId" in recorded[3].properties).toBe(false);
  });

  it("같은 사용자로 identify 를 반복하거나 익명 상태에서 reset 해도 한 번만 보낸다", async () => {
    const { provider, recorded } = createRecorder();
    await setupAnalytics([provider]);

    resetUser();
    identifyUser("u1");
    identifyUser("u1");
    resetUser();
    resetUser();

    expect(recorded.map((r) => r.type)).toEqual(["identify", "reset"]);
  });

  it("초기화 전에 보낸 화면 진입 이벤트도 초기화 후 순서대로 나간다", async () => {
    const { provider, recorded } = createRecorder();

    trackEvent("product_list_view", { category: "all", sort: "latest", page: 1, hasQuery: false });
    trackEvent("cart_add", { productId: "p2", quantity: 1 });
    await setupAnalytics([provider]);

    expect(recorded.map((r) => (r.type === "track" ? r.event : r.type))).toEqual([
      "product_list_view",
      "cart_add",
    ]);
  });
});

describe("loginFromReturnTo", () => {
  it("복원 경로의 첫 세그먼트로 출처를 정한다", () => {
    expect(loginFromReturnTo("/checkout")).toBe("cart");
    expect(loginFromReturnTo("/orders?page=2")).toBe("orders");
    expect(loginFromReturnTo("/mypage")).toBe("mypage");
    expect(loginFromReturnTo("/")).toBe("direct");
    expect(loginFromReturnTo("/products")).toBe("direct");
  });
});
