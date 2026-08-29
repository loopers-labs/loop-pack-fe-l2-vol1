import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { SESSION_COOKIE } from "@/app/api/_data/auth-cookies";
import { proxy } from "./authProxy";

const request = (pathname: string, session?: string) => {
  const nextRequest = new NextRequest(`http://localhost${pathname}`);
  if (session !== undefined) {
    nextRequest.cookies.set(SESSION_COOKIE, session);
  }
  return nextRequest;
};

const redirectLocation = (response: Response) => response.headers.get("location");

describe("auth proxy", () => {
  it("비로그인 상태로 주문서에 접근하면 로그인 페이지로 이동하고 redirectTo를 보존한다", () => {
    const response = proxy(request("/order"));

    expect(response.status).toBe(307);
    expect(redirectLocation(response)).toBe("http://localhost/login?redirectTo=%2Forder");
  });

  it("비로그인 상태로 query가 있는 주문 내역에 접근하면 query까지 redirectTo에 보존한다", () => {
    const response = proxy(request("/orders?page=2"));

    expect(response.status).toBe(307);
    expect(redirectLocation(response)).toBe(
      "http://localhost/login?redirectTo=%2Forders%3Fpage%3D2",
    );
  });

  it("세션 쿠키가 있으면 보호 경로에 접근해도 통과한다", () => {
    const response = proxy(request("/orders", "signed-session"));

    expect(response.status).toBe(200);
    expect(redirectLocation(response)).toBeNull();
  });

  it("공개 경로는 세션 쿠키가 없어도 통과한다", () => {
    const response = proxy(request("/products"));

    expect(response.status).toBe(200);
    expect(redirectLocation(response)).toBeNull();
  });

  it("로그인 페이지는 세션 쿠키가 없어도 통과한다", () => {
    const response = proxy(request("/login?redirectTo=/orders"));

    expect(response.status).toBe(200);
    expect(redirectLocation(response)).toBeNull();
  });

  it("정적 파일과 API 요청은 세션 쿠키가 없어도 통과한다", () => {
    expect(proxy(request("/api/products")).status).toBe(200);
    expect(proxy(request("/_next/static/chunks/app.js")).status).toBe(200);
  });

  it("세션 쿠키가 있으면 로그인 페이지 접근 시 기본 경로로 이동한다", () => {
    const response = proxy(request("/login", "signed-session"));

    expect(response.status).toBe(307);
    expect(redirectLocation(response)).toBe("http://localhost/");
  });

  it("세션 쿠키가 있으면 로그인 페이지의 안전한 redirectTo로 이동한다", () => {
    const response = proxy(request("/login?redirectTo=/orders", "signed-session"));

    expect(response.status).toBe(307);
    expect(redirectLocation(response)).toBe("http://localhost/orders");
  });

  it("세션 쿠키가 있어도 로그인 페이지의 외부 redirectTo는 기본 경로로 이동한다", () => {
    const response = proxy(request("/login?redirectTo=https://evil.example", "signed-session"));

    expect(response.status).toBe(307);
    expect(redirectLocation(response)).toBe("http://localhost/");
  });
});
