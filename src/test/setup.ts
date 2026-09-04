import { afterAll, afterEach, beforeAll, vi } from "vitest";

import { useCartStore } from "@/entities/cart/model/cartStore";
import { useWishlistStore } from "@/entities/wishlist/model/wishlistStore";

import { redirectMock, routerMock } from "./navigation";
import { server } from "./server";

// toBeInTheDocument 같은 DOM 매처를 vitest의 expect에 붙인다(+ 타입 augmentation).
// node 환경 테스트에서도 로드되지만 매처를 안 쓰면 그만이라 무해하다.
import "@testing-library/jest-dom/vitest";

// next/navigation은 서드파티라 라우팅을 쓰는 거의 모든 컴포넌트 테스트가 목킹한다.
// jsdom엔 App Router 컨텍스트가 없어 실제 구현을 쓸 일이 없으므로, 파일마다 다시 깔지 않고 여기서 한 번 건다.
// 목 실체는 navigation.ts에 두고, 검증하는 테스트가 훅을 부르지 않고 그 객체를 직접 집게 한다.
vi.mock("next/navigation", () => ({ useRouter: () => routerMock, redirect: redirectMock }));

// jsdom엔 레이아웃 엔진이 없어 scrollIntoView가 구현돼 있지 않다. noop으로 채운다.
// node 환경엔 Element 자체가 없으므로 가드한다.
if (typeof Element !== "undefined") {
  Element.prototype.scrollIntoView = () => {};
}

// 모킹하지 않은 요청은 조용히 나가지 않도록 error로 막는다.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

afterEach(() => {
  // 테스트 안에서 덮어쓴 핸들러를 기본 성공 핸들러로 되돌린다.
  server.resetHandlers();
  // zustand 스토어는 모듈 단위로 하나뿐이라, 리셋하지 않으면
  // 이전 테스트에서 담은 상태가 다음 테스트로 샌다.
  useCartStore.setState({ cartIds: [] });
  useWishlistStore.setState({ wishlistIds: [] });
  // localStorage도 마찬가지다. jsdom에만 있으므로 가드한다.
  if (typeof localStorage !== "undefined") {
    localStorage.clear();
  }
});
