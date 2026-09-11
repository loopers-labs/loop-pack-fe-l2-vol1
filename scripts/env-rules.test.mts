import { describe, expect, it } from "vitest";

import { formatProblems, validateEnv } from "./env-rules.mts";

const ORIGIN = "http://localhost:3000";
const valid = { APP_ORIGIN: ORIGIN, NEXT_PUBLIC_BASE_URL: ORIGIN };

const names = (env: Record<string, string | undefined>) =>
  validateEnv(env).map((problem) => problem.name);

describe("validateEnv", () => {
  it("두 origin이 같고 비밀·mock 플래그가 없으면 통과한다", () => {
    expect(validateEnv(valid)).toEqual([]);
  });

  it("APP_ORIGIN이 없으면 실패하고 '설정되지 않았습니다'로 알린다", () => {
    const [problem] = validateEnv({ NEXT_PUBLIC_BASE_URL: ORIGIN });
    expect(problem).toMatchObject({ name: "APP_ORIGIN", problem: "설정되지 않았습니다" });
  });

  it("빈 문자열은 미설정과 같이 실패한다", () => {
    expect(names({ ...valid, APP_ORIGIN: "" })).toEqual(["APP_ORIGIN"]);
  });

  it.each([
    "localhost:3000",
    "ftp://localhost:3000",
    "http://localhost:3000/",
    "http://localhost:3000/api",
    "http://localhost:3000?x=1",
    "http://LOCALHOST:3000",
    "http://localhost:80",
  ])("origin이 아닌 값 %s은 실패한다", (value) => {
    expect(names({ APP_ORIGIN: value, NEXT_PUBLIC_BASE_URL: value })).toEqual([
      "APP_ORIGIN",
      "NEXT_PUBLIC_BASE_URL",
    ]);
  });

  it("둘 다 유효해도 서로 다르면 NEXT_PUBLIC_BASE_URL 쪽을 지적한다", () => {
    const problems = validateEnv({
      APP_ORIGIN: ORIGIN,
      NEXT_PUBLIC_BASE_URL: "https://example.com",
    });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatchObject({ name: "NEXT_PUBLIC_BASE_URL" });
    expect(problems[0]?.problem).toContain("같아야");
  });

  it("mock 시나리오는 로컬에서는 허용하고 CI·배포에서는 거부한다", () => {
    const withMock = { ...valid, NEXT_PUBLIC_MOCK_SCENARIO: "slow" };
    expect(names(withMock)).toEqual([]);
    // 빈 값은 미설정과 같다 — CI=""도 CI로 안 보고, MOCK=""도 설정으로 안 본다.
    expect(names({ ...withMock, CI: "" })).toEqual([]);
    expect(names({ ...valid, CI: "true", NEXT_PUBLIC_MOCK_SCENARIO: "" })).toEqual([]);
    expect(names({ ...withMock, CI: "true" })).toEqual(["NEXT_PUBLIC_MOCK_SCENARIO"]);
    expect(names({ ...withMock, VERCEL_ENV: "preview" })).toEqual(["NEXT_PUBLIC_MOCK_SCENARIO"]);
  });

  it("세션 시크릿은 production에서만 요구하고 32바이트 미만·미설정을 거부한다", () => {
    expect(names({ ...valid, VERCEL_ENV: "preview" })).toEqual([]);
    expect(names({ ...valid, VERCEL_ENV: "production" })).toEqual(["AUTH_SESSION_SECRET"]);
    expect(names({ ...valid, VERCEL_ENV: "production", AUTH_SESSION_SECRET: "short" })).toEqual([
      "AUTH_SESSION_SECRET",
    ]);
    // 길이는 문자가 아니라 바이트로 센다 — 한글 10자는 30바이트라 모자란다.
    expect(
      names({ ...valid, VERCEL_ENV: "production", AUTH_SESSION_SECRET: "가".repeat(10) }),
    ).toEqual(["AUTH_SESSION_SECRET"]);
    expect(
      names({ ...valid, VERCEL_ENV: "production", AUTH_SESSION_SECRET: "x".repeat(32) }),
    ).toEqual([]);
  });

  describe("production origin 일치(⑥)", () => {
    const mine = "https://my-app-indol.vercel.app";
    const production = {
      APP_ORIGIN: mine,
      NEXT_PUBLIC_BASE_URL: mine,
      VERCEL_ENV: "production",
      AUTH_SESSION_SECRET: "x".repeat(32),
      VERCEL_PROJECT_PRODUCTION_URL: "my-app-indol.vercel.app",
    };
    const other = "https://my-app.vercel.app";

    it("APP_ORIGIN이 Vercel production 도메인과 같으면 통과한다(대소문자 무관)", () => {
      expect(names(production)).toEqual([]);
      expect(
        names({ ...production, VERCEL_PROJECT_PRODUCTION_URL: "My-App-Indol.vercel.app" }),
      ).toEqual([]);
    });

    it("같은 이름의 vercel.app이 남의 것이었던 사고: 형태는 맞는데 도메인이 내 것이 아니면 실패한다", () => {
      const problems = validateEnv({
        ...production,
        APP_ORIGIN: other,
        NEXT_PUBLIC_BASE_URL: other,
      });
      expect(problems.map((problem) => problem.name)).toEqual(["APP_ORIGIN"]);
      expect(problems[0]?.problem).toContain("https://my-app-indol.vercel.app");
    });

    it.each([
      ["http 스킴", "http://my-app-indol.vercel.app"],
      ["포트 표기", "https://my-app-indol.vercel.app:8443"],
    ])("도메인이 같아도 %s이면 실패한다 — Vercel은 https 기본 포트만 서빙한다", (_, origin) => {
      expect(names({ ...production, APP_ORIGIN: origin, NEXT_PUBLIC_BASE_URL: origin })).toEqual([
        "APP_ORIGIN",
      ]);
    });

    it("APP_ORIGIN 자체가 URL이 아니면 형태 규칙만 보고하고 ⑥은 중복 보고하지 않는다", () => {
      expect(names({ ...production, APP_ORIGIN: "bad" })).toEqual(["APP_ORIGIN"]);
    });

    it("Vercel 밖(도메인 변수 없음·빈 값)이나 preview에서는 도메인이 달라도 개입하지 않는다", () => {
      const mismatch = { ...production, APP_ORIGIN: other, NEXT_PUBLIC_BASE_URL: other };
      expect(names({ ...mismatch, VERCEL_PROJECT_PRODUCTION_URL: undefined })).toEqual([]);
      expect(names({ ...mismatch, VERCEL_PROJECT_PRODUCTION_URL: "" })).toEqual([]);
      expect(names({ ...mismatch, VERCEL_ENV: "preview" })).toEqual([]);
    });
  });

  it.each([
    "NEXT_PUBLIC_API_SECRET",
    "NEXT_PUBLIC_AUTH_TOKEN",
    "NEXT_PUBLIC_DB_PASSWORD",
    "NEXT_PUBLIC_MAPS_KEY",
  ])("비밀로 보이는 이름 %s에 NEXT_PUBLIC_이 붙으면 실패한다", (name) => {
    expect(names({ ...valid, [name]: "value" })).toEqual([name]);
  });

  it("서버 전용 이름의 비밀은 지적하지 않는다", () => {
    expect(names({ ...valid, AUTH_SESSION_SECRET: "x".repeat(32), API_TOKEN: "t" })).toEqual([]);
  });

  it("문제가 여럿이면 전부 모아 돌려준다", () => {
    const problems = validateEnv({
      CI: "true",
      NEXT_PUBLIC_MOCK_SCENARIO: "error",
      NEXT_PUBLIC_SECRET: "s",
    });
    expect(problems.map((problem) => problem.name)).toEqual([
      "APP_ORIGIN",
      "NEXT_PUBLIC_BASE_URL",
      "NEXT_PUBLIC_MOCK_SCENARIO",
      "NEXT_PUBLIC_SECRET",
    ]);
  });

  it("리포트 표는 값에 든 |를 이스케이프해 열이 밀리지 않는다", () => {
    const markdown = formatProblems([{ name: "APP_ORIGIN", problem: 'Invalid URL. 지금은 "a|b"' }]);
    expect(markdown).toContain('| `APP_ORIGIN` | Invalid URL. 지금은 "a\\|b" |');
    expect(markdown.split("\n").filter((line) => line.startsWith("|"))).toHaveLength(3);
  });
});
