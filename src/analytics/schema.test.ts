import { afterEach, describe, expect, it } from "vitest";

import {
  initAnalytics,
  registerProviders,
  resetAnalyticsForTest,
  setCommonProperties,
} from "@/analytics/logger";
import type { AnalyticsProvider } from "@/analytics/provider";
import { trackEvent } from "@/analytics/schema";

// trackEvent가 실제로 낸 이름·props를 잡는 recorder. 스타터 로거를 통해 흐른다.
function createRecorder() {
  const events: Array<{ name: string; props: Record<string, unknown> }> = [];
  const provider: AnalyticsProvider = {
    name: "recorder",
    initialize: () => {},
    track: (name, props) => events.push({ name, props }),
    identify: () => {},
    reset: () => {},
  };
  registerProviders([provider]);
  return events;
}

afterEach(() => {
  resetAnalyticsForTest();
});

// 로그인 상태에 따라 공통 프로퍼티에 userId가 붙는지를 실제 계측 경로로 검증한다.
// 시드에서도 userId 없는 비회원 이벤트가 대다수라, 비회원 이벤트에 userId가 새어 들어가면 안 된다.
describe("로그인 상태와 공통 프로퍼티", () => {
  it("비회원 이벤트에는 userId가 붙지 않는다", async () => {
    const events = createRecorder();
    setCommonProperties(() => ({ sessionId: "s_1" })); // userId 없음 = 비회원
    await initAnalytics();

    trackEvent("cart_add", { productId: "p1" });

    expect(events[0]?.props).not.toHaveProperty("userId");
    expect(events[0]?.props).toMatchObject({ sessionId: "s_1", productId: "p1" });
  });

  it("로그인 상태의 이벤트에는 userId가 붙는다", async () => {
    const events = createRecorder();
    setCommonProperties(() => ({ sessionId: "s_1", userId: "u1" }));
    await initAnalytics();

    trackEvent("order_complete", { productIds: ["p1"] });

    expect(events[0]?.props).toMatchObject({ userId: "u1", productIds: ["p1"] });
  });

  // 한 세션 안에서 로그인 상태가 바뀌면, 바뀐 시점을 기준으로 그 뒤 이벤트에 userId가 맞게 갈린다.
  // 공통 프로퍼티는 발화 시점에 평가되므로(getter), 전환 전후를 한 흐름에서 확인한다.
  it("로그인 중 이벤트에는 userId가 붙고, 이어서 로그아웃하면 그 뒤 이벤트에서 빠진다", async () => {
    const events = createRecorder();
    let userId: string | null = "u1"; // 로그인 상태로 시작
    setCommonProperties(() =>
      userId === null ? { sessionId: "s_1" } : { sessionId: "s_1", userId },
    );
    await initAnalytics();

    trackEvent("cart_add", { productId: "p1" }); // 로그인 중
    userId = null; // 로그아웃
    trackEvent("wishlist_add", { productId: "p2" }); // 로그아웃 후

    expect(events[0]?.props).toMatchObject({ userId: "u1" });
    expect(events[1]?.props).not.toHaveProperty("userId");
  });

  it("비회원 이벤트에는 userId가 없고, 이어서 로그인하면 그 뒤 이벤트에 userId가 붙는다", async () => {
    const events = createRecorder();
    let userId: string | null = null; // 비회원으로 시작
    setCommonProperties(() =>
      userId === null ? { sessionId: "s_1" } : { sessionId: "s_1", userId },
    );
    await initAnalytics();

    trackEvent("cart_add", { productId: "p1" }); // 비회원
    userId = "u1"; // 로그인
    trackEvent("order_complete", { productIds: ["p1"] }); // 로그인 후

    expect(events[0]?.props).not.toHaveProperty("userId");
    expect(events[1]?.props).toMatchObject({ userId: "u1" });
  });

  // login_success는 로그인 화면에서 성공한 순간의 이벤트라, 세션이 클라에 반영되기(AnalyticsSessionSync가
  // userId를 세팅하기) 전에 찍힌다. 따라서 login_success에는 userId가 없고, 그 뒤 이벤트부터 붙는다.
  // 시드의 login_success props도 { from }뿐이라 이 동작과 일치한다.
  it("login_success에는 아직 userId가 없고, 세션 반영 뒤 이벤트부터 userId가 붙는다", async () => {
    const events = createRecorder();
    let userId: string | null = null; // 로그인 성공 직후엔 아직 반영 전
    setCommonProperties(() =>
      userId === null ? { sessionId: "s_1" } : { sessionId: "s_1", userId },
    );
    await initAnalytics();

    trackEvent("login_success", { from: "/orders" }); // 성공 순간 — userId 반영 전
    userId = "u1"; // AnalyticsSessionSync가 세션을 반영
    trackEvent("order_start", { productIds: ["p1"] }); // 그 뒤 이벤트

    expect(events[0]?.props).not.toHaveProperty("userId");
    expect(events[1]?.props).toMatchObject({ userId: "u1" });
  });
});

describe("trackEvent 스키마", () => {
  it("이벤트 이름과 props를 그대로 전달한다", async () => {
    const events = createRecorder();
    await initAnalytics();

    trackEvent("sort_change", { sort: "popular" });
    trackEvent("cart_add", { productId: "p1" });

    expect(events).toEqual([
      { name: "sort_change", props: { sort: "popular" } },
      { name: "cart_add", props: { productId: "p1" } },
    ]);
  });

  it("같은 상품을 여러 번 담으면 각각 다른 productId로 남는다", async () => {
    const events = createRecorder();
    await initAnalytics();

    trackEvent("cart_add", { productId: "p1" });
    trackEvent("cart_add", { productId: "p2" });
    trackEvent("cart_add", { productId: "p3" });

    expect(events.map((event) => event.props.productId)).toEqual(["p1", "p2", "p3"]);
  });

  it("주문 이벤트의 productIds는 배열을 그대로 싣는다", async () => {
    const events = createRecorder();
    await initAnalytics();

    trackEvent("order_complete", { productIds: ["p1", "p2", "p3"] });

    expect(events[0]?.props.productIds).toEqual(["p1", "p2", "p3"]);
  });
});

// 완료조건: 사용자 흐름에서 이벤트가 어떤 순서로 남는지 문서(스키마)만 보고 예측 가능해야 한다.
// 사용자 여정은 하나가 아니라 여러 갈래다. 각 여정을 한 테스트에 몰아 순서를 고정한다(여정 간엔 격리).
// 이벤트 순서 자체가 검증 대상이라 시퀀스를 한 테스트가 처음부터 끝까지 수행한다.
describe("사용자 여정별 이벤트 시퀀스", () => {
  // 각 여정 테스트가 recorder를 새로 등록하고 흐름을 재생한 뒤 이름 순서를 확인한다.
  async function replay(steps: () => void): Promise<string[]> {
    const events = createRecorder();
    await initAnalytics();
    steps();
    return events.map((event) => event.name);
  }

  it("익명으로 담고 주문서에서 로그인하는 여정 — order_start가 로그인보다 앞선다", async () => {
    // 익명 담기 → 주문서 진입 → 로그인 게이트(주문서가 보호 경로) → 주문 완료.
    const names = await replay(() => {
      trackEvent("product_list_view", { category: "all", sort: "latest", page: 1 });
      trackEvent("cart_add", { productId: "p1" });
      trackEvent("order_start", { productIds: ["p1"] });
      trackEvent("login_start", { from: "/order-form" });
      trackEvent("login_success", { from: "/order-form" });
      trackEvent("order_complete", { productIds: ["p1"] });
    });

    expect(names).toEqual([
      "product_list_view",
      "cart_add",
      "order_start",
      "login_start",
      "login_success",
      "order_complete",
    ]);
  });

  it("먼저 로그인하고 담아 주문하는 여정 — 로그인이 담기보다 앞선다", async () => {
    const names = await replay(() => {
      trackEvent("login_start", { from: "direct" });
      trackEvent("login_success", { from: "direct" });
      trackEvent("product_list_view", { category: "all", sort: "latest", page: 1 });
      trackEvent("cart_add", { productId: "p1" });
      trackEvent("order_start", { productIds: ["p1"] });
      trackEvent("order_complete", { productIds: ["p1"] });
    });

    expect(names).toEqual([
      "login_start",
      "login_success",
      "product_list_view",
      "cart_add",
      "order_start",
      "order_complete",
    ]);
  });

  it("로그인 실패 후 다시 시도해 성공하는 여정 — login_fail이 남고 login_success가 뒤따른다", async () => {
    const names = await replay(() => {
      trackEvent("login_start", { from: "/order-form" });
      trackEvent("login_fail", { reason: "이메일 또는 비밀번호를 확인해주세요." });
      trackEvent("login_success", { from: "/order-form" });
    });

    expect(names).toEqual(["login_start", "login_fail", "login_success"]);
  });

  it("로그인 없이 둘러보는 비회원 여정 — 로그인·주문 이벤트 없이 목록 조작만 남는다", async () => {
    // 시드에서도 userId 없는 비회원 이벤트가 대다수다. 익명으로 둘러보다 이탈하는 흐름이 기본이다.
    const names = await replay(() => {
      trackEvent("product_list_view", { category: "all", sort: "latest", page: 1 });
      trackEvent("category_filter_change", { category: "fashion" });
      trackEvent("sort_change", { sort: "popular" });
      trackEvent("cart_add", { productId: "p1" });
      trackEvent("wishlist_add", { productId: "p2" });
    });

    expect(names).toEqual([
      "product_list_view",
      "category_filter_change",
      "sort_change",
      "cart_add",
      "wishlist_add",
    ]);
  });
});
