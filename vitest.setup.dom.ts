import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { resetCart } from "@/entities/cart/model/store";
import { resetWishlist } from "@/entities/wishlist/model/store";
import { server } from "@/mocks/server";

// 모킹되지 않은 요청이 조용히 나가면 테스트가 무엇을 전제했는지 알 수 없게 된다.
// 경계를 넘는 즉시 실패로 만든다.
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  // zustand store는 모듈 싱글턴이라 한 파일 안에서도, 파일 사이에서도 상태가 남는다.
  // 여기서 되돌리지 않으면 테스트 순서가 결과를 바꾼다.
  resetCart();
  resetWishlist();
});

afterAll(() => {
  server.close();
});
