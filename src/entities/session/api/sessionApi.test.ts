import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "@/shared/config/vitest/mswServer";
import { getSession, login, logout } from "./sessionApi";

const TEST_API_ORIGIN = "http://test.local";
const user = {
  id: "u1",
  name: "루퍼1",
  email: "looper1@loopers.dev",
};

describe("sessionApi", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("세션 조회에서 200 응답은 로그인 사용자로 반환한다", async () => {
    vi.stubEnv("APP_ORIGIN", TEST_API_ORIGIN);
    server.use(
      http.get(`${TEST_API_ORIGIN}/api/auth/me`, () =>
        HttpResponse.json({
          user,
        }),
      ),
    );

    await expect(getSession()).resolves.toEqual({ user });
  });

  it("세션 조회에서 401 응답은 에러가 아니라 비로그인 상태로 반환한다", async () => {
    vi.stubEnv("APP_ORIGIN", TEST_API_ORIGIN);
    server.use(
      http.get(`${TEST_API_ORIGIN}/api/auth/me`, () =>
        HttpResponse.json({ message: "로그인이 필요합니다." }, { status: 401 }),
      ),
    );

    await expect(getSession()).resolves.toEqual({ user: null });
  });

  it("세션 조회에서 500 응답은 세션 확인 실패 에러로 반환한다", async () => {
    vi.stubEnv("APP_ORIGIN", TEST_API_ORIGIN);
    server.use(
      http.get(`${TEST_API_ORIGIN}/api/auth/me`, () =>
        HttpResponse.json({ message: "세션을 확인하지 못했습니다." }, { status: 500 }),
      ),
    );

    await expect(getSession()).rejects.toThrow("세션을 확인하지 못했습니다.");
  });

  it("로그인은 이메일과 비밀번호를 보내고 로그인 사용자를 반환한다", async () => {
    vi.stubEnv("APP_ORIGIN", TEST_API_ORIGIN);
    let requestBody: unknown;
    server.use(
      http.post(`${TEST_API_ORIGIN}/api/auth/login`, async ({ request }) => {
        requestBody = await request.json();

        return HttpResponse.json({ user });
      }),
    );

    await expect(
      login({
        email: "looper1@loopers.dev",
        password: "looper1234",
      }),
    ).resolves.toEqual({ user });
    expect(requestBody).toEqual({
      email: "looper1@loopers.dev",
      password: "looper1234",
    });
  });

  it("로그인 실패 응답은 API 메시지로 에러를 반환한다", async () => {
    vi.stubEnv("APP_ORIGIN", TEST_API_ORIGIN);
    server.use(
      http.post(`${TEST_API_ORIGIN}/api/auth/login`, () =>
        HttpResponse.json({ message: "이메일 또는 비밀번호를 확인해주세요." }, { status: 401 }),
      ),
    );

    await expect(
      login({
        email: "looper1@loopers.dev",
        password: "wrong-password",
      }),
    ).rejects.toThrow("이메일 또는 비밀번호를 확인해주세요.");
  });

  it("로그아웃은 세션 제거 요청을 보낸다", async () => {
    vi.stubEnv("APP_ORIGIN", TEST_API_ORIGIN);
    let requestedMethod: string | undefined;
    server.use(
      http.post(`${TEST_API_ORIGIN}/api/auth/logout`, ({ request }) => {
        requestedMethod = request.method;

        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(logout()).resolves.toBeUndefined();
    expect(requestedMethod).toBe("POST");
  });
});
