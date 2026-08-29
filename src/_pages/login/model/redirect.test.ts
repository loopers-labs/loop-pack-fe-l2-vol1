import { describe, expect, it } from "vitest";
import { normalizeLoginRedirectPath } from "./redirect";

describe("normalizeLoginRedirectPath", () => {
  it("내부 경로와 query는 로그인 후 복원 경로로 허용한다", () => {
    expect(normalizeLoginRedirectPath("/orders?tab=recent")).toBe("/orders?tab=recent");
  });

  it("외부 주소와 프로토콜 상대 주소는 홈으로 보정한다", () => {
    expect(normalizeLoginRedirectPath("https://evil.example/orders")).toBe("/");
    expect(normalizeLoginRedirectPath("//evil.example/orders")).toBe("/");
  });

  it("비어 있거나 슬래시로 시작하지 않는 값은 홈으로 보정한다", () => {
    expect(normalizeLoginRedirectPath(null)).toBe("/");
    expect(normalizeLoginRedirectPath("orders")).toBe("/");
  });
});
