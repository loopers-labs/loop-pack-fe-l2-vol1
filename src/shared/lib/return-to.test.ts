import { describe, expect, it } from "vitest";
import { buildLoginUrl, sanitizeReturnTo } from "./return-to";

describe("sanitizeReturnTo", () => {
  it("같은 사이트 경로는 쿼리까지 그대로 돌려준다", () => {
    expect(sanitizeReturnTo("/orders")).toBe("/orders");
    expect(sanitizeReturnTo("/products?category=casual&page=2")).toBe(
      "/products?category=casual&page=2",
    );
  });

  it.each<[string | null | undefined, string]>([
    ["https://evil.com", "절대 URL"],
    ["//evil.com/orders", "프로토콜 상대 URL"],
    ["/\\evil.com", "역슬래시 호스트 우회"],
    ["javascript:alert(1)", "스킴"],
    ["orders", "슬래시 없는 상대 경로"],
    ["/orders\nSet-Cookie: x", "제어 문자"],
    ["/orders x", "공백"],
    ["", "빈 문자열"],
    [null, "null"],
    [undefined, "undefined"],
  ])("%s (%s) 는 기본 경로로 떨어진다", (value) => {
    expect(sanitizeReturnTo(value)).toBe("/");
  });

  it("로그인 페이지 자기 자신은 복원 대상이 아니다", () => {
    expect(sanitizeReturnTo("/login")).toBe("/");
    expect(sanitizeReturnTo("/login?next=%2Forders")).toBe("/");
    expect(sanitizeReturnTo("/login/anything")).toBe("/");
  });

  it("API 라우트는 화면이 아니므로 복원 대상이 아니다", () => {
    expect(sanitizeReturnTo("/api/auth/logout")).toBe("/");
    expect(sanitizeReturnTo("/api")).toBe("/");
    expect(sanitizeReturnTo("/apiary")).toBe("/apiary");
  });
});

describe("buildLoginUrl", () => {
  it("복원 경로와 사유를 쿼리로 싣는다", () => {
    expect(buildLoginUrl("/orders")).toBe("/login?next=%2Forders");
    expect(buildLoginUrl("/orders", "expired")).toBe("/login?next=%2Forders&reason=expired");
  });

  it("기본 경로면 next 를 생략하고, 외부 주소는 실어 나르지 않는다", () => {
    expect(buildLoginUrl("/")).toBe("/login");
    expect(buildLoginUrl("https://evil.com", "expired")).toBe("/login?reason=expired");
  });
});
