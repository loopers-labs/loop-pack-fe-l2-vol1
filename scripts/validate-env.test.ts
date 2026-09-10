import { describe, expect, it } from "vitest";

import { isDeployLike, validateEnv } from "./validate-env.mjs";

const strictEnv = {
  CI: "true",
  APP_ORIGIN: "https://commerce.example.com",
  AUTH_SESSION_SECRET: "a".repeat(40),
};

const rulesOf = (env: Record<string, string | undefined>) =>
  validateEnv(env).errors.map((finding) => `${finding.variable}:${finding.rule}`);

describe("validateEnv", () => {
  it("CI·Vercel·production 중 하나면 strict 모드다", () => {
    expect(isDeployLike({ CI: "true" })).toBe(true);
    expect(isDeployLike({ VERCEL_ENV: "preview" })).toBe(true);
    expect(isDeployLike({ NODE_ENV: "production" })).toBe(true);
    expect(isDeployLike({})).toBe(false);
  });

  it("올바른 strict 환경은 error 가 없다", () => {
    expect(rulesOf(strictEnv)).toEqual([]);
  });

  it("strict 에서 필수 변수가 비면 실패하고, local 에서는 경고만 남긴다", () => {
    expect(rulesOf({ CI: "true" })).toEqual([
      "APP_ORIGIN:required",
      "AUTH_SESSION_SECRET:required",
    ]);
    const local = validateEnv({});
    expect(local.errors).toEqual([]);
    expect(local.findings.map((finding) => finding.level)).toEqual(["warn", "warn"]);
  });

  it("코드에 박힌 개발용 secret 이나 짧은 secret 은 배포에 쓸 수 없다", () => {
    expect(rulesOf({ ...strictEnv, AUTH_SESSION_SECRET: "loopers-week09-secret" })).toEqual([
      "AUTH_SESSION_SECRET:dev-fallback",
    ]);
    expect(rulesOf({ ...strictEnv, AUTH_SESSION_SECRET: "short" })).toEqual([
      "AUTH_SESSION_SECRET:too-short",
    ]);
  });

  it("APP_ORIGIN 은 http(s) origin 만 허용한다", () => {
    expect(rulesOf({ ...strictEnv, APP_ORIGIN: "not-a-url" })).toEqual(["APP_ORIGIN:invalid-url"]);
    expect(rulesOf({ ...strictEnv, APP_ORIGIN: "ftp://commerce.example.com" })).toEqual([
      "APP_ORIGIN:protocol",
    ]);
    expect(rulesOf({ ...strictEnv, APP_ORIGIN: "https://commerce.example.com/shop" })).toEqual([
      "APP_ORIGIN:origin-only",
    ]);
    expect(rulesOf({ ...strictEnv, APP_ORIGIN: "https://commerce.example.com/" })).toEqual([
      "APP_ORIGIN:origin-only",
    ]);
    expect(rulesOf({ ...strictEnv, APP_ORIGIN: "http://localhost:3000" })).toEqual([]);
  });

  it("Preview 는 APP_ORIGIN 이 없어도 VERCEL_URL 로 유도하고, production 은 명시를 요구한다", () => {
    const preview = validateEnv({
      VERCEL_ENV: "preview",
      VERCEL_URL: "commerce-abc123.vercel.app",
      AUTH_SESSION_SECRET: "a".repeat(40),
    });
    expect(preview.errors).toEqual([]);
    expect(preview.findings).toEqual([
      expect.objectContaining({
        level: "warn",
        variable: "APP_ORIGIN",
        rule: "derived",
        seen: "https://commerce-abc123.vercel.app",
      }),
    ]);
    expect(
      rulesOf({
        VERCEL_ENV: "production",
        VERCEL_URL: "commerce-abc123.vercel.app",
        AUTH_SESSION_SECRET: "a".repeat(40),
      }),
    ).toEqual(["APP_ORIGIN:required"]);
  });

  it("Vercel production 은 https 를 요구한다", () => {
    expect(
      rulesOf({
        ...strictEnv,
        VERCEL_ENV: "production",
        APP_ORIGIN: "http://commerce.example.com",
      }),
    ).toEqual(["APP_ORIGIN:https-required"]);
  });

  it("Preview 가 production origin 을 바라보면 실패하고, production 자신은 통과한다", () => {
    const vercel = { ...strictEnv, VERCEL_PROJECT_PRODUCTION_URL: "commerce.example.com" };
    expect(rulesOf({ ...vercel, VERCEL_ENV: "preview" })).toEqual([
      "APP_ORIGIN:preview-points-to-production",
    ]);
    expect(rulesOf({ ...vercel, VERCEL_ENV: "production" })).toEqual([]);
    expect(
      rulesOf({
        ...vercel,
        VERCEL_ENV: "preview",
        APP_ORIGIN: "https://commerce-git-feat.vercel.app",
      }),
    ).toEqual([]);
  });

  it("비밀스러운 이름에 NEXT_PUBLIC_ 이 붙으면 실패한다", () => {
    expect(rulesOf({ ...strictEnv, NEXT_PUBLIC_AUTH_SESSION_SECRET: "leaked" })).toEqual([
      "NEXT_PUBLIC_AUTH_SESSION_SECRET:public-secret-name",
    ]);
    expect(rulesOf({ ...strictEnv, NEXT_PUBLIC_API_TOKEN: "x" })).toEqual([
      "NEXT_PUBLIC_API_TOKEN:public-secret-name",
    ]);
  });

  it("비공개 secret 값이 NEXT_PUBLIC_ 값 안에 복사되면 이름이 멀쩡해도 실패한다", () => {
    expect(
      rulesOf({
        ...strictEnv,
        NEXT_PUBLIC_API_BASE: `https://api.example.com?key=${strictEnv.AUTH_SESSION_SECRET}`,
      }),
    ).toEqual(["NEXT_PUBLIC_API_BASE:public-secret-value"]);
  });

  it("허용 목록에 없는 NEXT_PUBLIC_ 변수는 경고만 남긴다", () => {
    const result = validateEnv({ ...strictEnv, NEXT_PUBLIC_FLAG: "on" });
    expect(result.errors).toEqual([]);
    expect(result.findings).toEqual([
      expect.objectContaining({
        level: "warn",
        variable: "NEXT_PUBLIC_FLAG",
        rule: "unknown-public",
      }),
    ]);
  });
});
