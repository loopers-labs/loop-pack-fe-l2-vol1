import { describe, expect, it } from "vitest";

import { safeRedirect } from "./safeRedirect";

// 복원 경로는 오픈 리다이렉트의 표적이다. 내부 절대 경로만 통과시키고 나머지는 기본값으로 돌린다.
describe("safeRedirect", () => {
  it("내부 절대 경로는 그대로 통과한다", () => {
    expect(safeRedirect("/orders")).toBe("/orders");
    expect(safeRedirect("/orders/history")).toBe("/orders/history");
  });

  it("쿼리스트링은 보존한다", () => {
    expect(safeRedirect("/products?category=fashion&page=2")).toBe(
      "/products?category=fashion&page=2",
    );
  });

  it("값이 없으면 기본값으로 돌린다", () => {
    expect(safeRedirect(null)).toBe("/");
    expect(safeRedirect(undefined)).toBe("/");
    expect(safeRedirect("")).toBe("/");
  });

  it("스킴·호스트로 시작하는 외부 주소는 막는다", () => {
    expect(safeRedirect("http://evil.com")).toBe("/");
    expect(safeRedirect("https://evil.com/path")).toBe("/");
    expect(safeRedirect("evil.com")).toBe("/"); // 상대(슬래시 없음)
  });

  it("protocol-relative(`//`)와 백슬래시 변형(`/\\`)은 외부로 나가므로 막는다", () => {
    expect(safeRedirect("//evil.com")).toBe("/");
    expect(safeRedirect("/\\evil.com")).toBe("/");
  });

  it("이미 디코드된 값만 검증한다 — 이중 인코딩은 재디코드하지 않아 통과 못 한다", () => {
    // URLSearchParams가 한 번 디코드한 뒤의 값. `%2F`가 남아 있으면 `/`로 시작하지 않아 걸린다.
    expect(safeRedirect("%2F%2Fevil.com")).toBe("/");
  });

  it("API 경로로는 돌려보내지 않는다", () => {
    expect(safeRedirect("/api")).toBe("/");
    expect(safeRedirect("/api/orders")).toBe("/");
  });

  it("로그인 경로로는 돌려보내지 않는다 (리다이렉트 루프 방지)", () => {
    expect(safeRedirect("/login")).toBe("/");
    expect(safeRedirect("/login?redirect=/orders")).toBe("/");
  });

  it("접두가 같아도 다른 경로는 막지 않는다", () => {
    expect(safeRedirect("/loginhelp")).toBe("/loginhelp");
    expect(safeRedirect("/apidocs")).toBe("/apidocs");
  });

  it("경로 traversal은 정규화 후 검사돼 우회하지 못한다", () => {
    expect(safeRedirect("/foo/../login")).toBe("/");
    expect(safeRedirect("/foo/../orders")).toBe("/orders");
  });
});
