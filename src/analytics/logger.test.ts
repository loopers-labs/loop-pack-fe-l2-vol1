import { afterEach, describe, expect, it, vi } from "vitest";
import type { AnalyticsProvider, EventProperties } from "./provider";
import {
  identify,
  initAnalytics,
  registerProviders,
  reset,
  resetAnalyticsForTest,
  setCommonProperties,
  track,
} from "./logger";

type Recorded =
  | { type: "track"; event: string; properties: EventProperties }
  | { type: "identify"; userId: string }
  | { type: "reset" };

const createRecorder = (overrides: Partial<AnalyticsProvider> = {}) => {
  const recorded: Recorded[] = [];
  const provider: AnalyticsProvider = {
    name: "recorder",
    initialize: () => {},
    track: (event, properties) => recorded.push({ type: "track", event, properties }),
    identify: (userId) => recorded.push({ type: "identify", userId }),
    reset: () => recorded.push({ type: "reset" }),
    ...overrides,
  };
  return { provider, recorded };
};

describe("analytics logger", () => {
  afterEach(() => {
    resetAnalyticsForTest();
    vi.restoreAllMocks();
  });

  it("초기화 전 이벤트를 버리지 않고 초기화 후 순서대로 보낸다", async () => {
    const { provider, recorded } = createRecorder();
    registerProviders([provider]);

    track("product_list_view", { page: 1 });
    identify("u1");
    expect(recorded).toEqual([]);

    await initAnalytics();

    expect(recorded).toEqual([
      { type: "track", event: "product_list_view", properties: { page: 1 } },
      { type: "identify", userId: "u1" },
    ]);
  });

  it("공통 프로퍼티를 붙이고, 같은 키는 이벤트 값이 이긴다", async () => {
    const { provider, recorded } = createRecorder();
    registerProviders([provider]);
    setCommonProperties(() => ({ sessionId: "s_1", device: "mobile" }));
    await initAnalytics();

    track("cart_add", { productId: "p1", device: "desktop" });

    expect(recorded).toEqual([
      {
        type: "track",
        event: "cart_add",
        properties: { sessionId: "s_1", device: "desktop", productId: "p1" },
      },
    ]);
  });

  it("공통 프로퍼티를 이벤트 발생 시점에 평가한다", async () => {
    const { provider, recorded } = createRecorder();
    registerProviders([provider]);

    let userId: string | null = null;
    setCommonProperties(() => ({ userId }));
    await initAnalytics();

    track("product_list_view");
    userId = "u3";
    track("order_complete");

    expect(recorded).toEqual([
      { type: "track", event: "product_list_view", properties: { userId: null } },
      { type: "track", event: "order_complete", properties: { userId: "u3" } },
    ]);
  });

  it("큐가 100개를 넘으면 오래된 것부터 버린다", async () => {
    const { provider, recorded } = createRecorder();
    registerProviders([provider]);

    for (let index = 0; index < 105; index += 1) {
      track(`event_${index}`);
    }
    await initAnalytics();

    expect(recorded).toHaveLength(100);
    expect(recorded[0]).toMatchObject({ event: "event_5" });
    expect(recorded[99]).toMatchObject({ event: "event_104" });
  });

  it("프로바이더 하나가 실패해도 나머지로 계속 보낸다", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const broken: AnalyticsProvider = {
      name: "broken",
      initialize: () => {},
      track: () => {
        throw new Error("전송 실패");
      },
      identify: () => {},
      reset: () => {},
    };
    const { provider, recorded } = createRecorder();
    registerProviders([broken, provider]);
    await initAnalytics();

    track("cart_add");

    expect(recorded).toEqual([{ type: "track", event: "cart_add", properties: {} }]);
    expect(consoleError).toHaveBeenCalledOnce();
  });

  it("초기화가 실패한 프로바이더가 있어도 나머지를 초기화한다", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { provider, recorded } = createRecorder({
      initialize: () => {
        throw new Error("초기화 실패");
      },
    });
    registerProviders([provider]);

    await initAnalytics();
    track("cart_add");

    expect(recorded).toEqual([{ type: "track", event: "cart_add", properties: {} }]);
    expect(consoleError).toHaveBeenCalledOnce();
  });

  it("initAnalytics를 두 번 불러도 큐를 한 번만 흘려보낸다", async () => {
    const { provider, recorded } = createRecorder();
    registerProviders([provider]);

    track("product_list_view");
    await initAnalytics();
    await initAnalytics();

    expect(recorded).toHaveLength(1);
  });

  it("reset도 큐를 거친다", async () => {
    const { provider, recorded } = createRecorder();
    registerProviders([provider]);

    reset();
    await initAnalytics();

    expect(recorded).toEqual([{ type: "reset" }]);
  });
});
