import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { SESSION_COOKIE } from "@/app/api/_data/auth-cookies";
import { config, proxy } from "./proxy";

const requestTo = (path: string, cookie?: string) => {
  const request = new NextRequest(`http://localhost:3000${path}`);
  if (cookie !== undefined) {
    request.cookies.set(SESSION_COOKIE, cookie);
  }
  return request;
};

describe("proxy", () => {
  it("세션 쿠키가 없으면 원래 경로(쿼리 포함)를 next 로 실어 로그인으로 보낸다", () => {
    const response = proxy(requestTo("/orders?page=2"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Forders%3Fpage%3D2",
    );
  });

  it("로그아웃으로 비워진 쿠키도 없는 것으로 본다", () => {
    const response = proxy(requestTo("/checkout", ""));

    expect(response.headers.get("location")).toBe("http://localhost:3000/login?next=%2Fcheckout");
  });

  it("쿠키가 있으면 서명을 검증하지 않고 통과시킨다 (검증은 페이지·API 의 몫)", () => {
    const response = proxy(requestTo("/mypage", "not-even-a-valid-token"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("보호 경로는 주문서·주문 내역·마이페이지다", () => {
    expect(config.matcher).toEqual(["/checkout/:path*", "/orders/:path*", "/mypage/:path*"]);
  });
});
