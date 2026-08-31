import { createHmac, timingSafeEqual } from "node:crypto";
import { SESSION_TTL_SECONDS } from "@/app/api/_data/auth-cookies";

// 이 파일은 node:crypto 를 쓴다. Node 런타임(API 라우트)에서만 import 해야 한다.
// Edge 런타임에서 쿠키 이름이 필요하면 auth-cookies.ts 에서 가져온다.
//
// 6주차에 구조를 바꾼 뒤에도 그대로 동작해야 하므로 응답 타입, 지연,
// 상품 id 검증을 모두 여기서 처리한다

// 인증 응답 계약. 본인 구조에 맞는 자리로 옮겨도 된다
export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthScenario = "invalid" | "expired" | "error" | "slow";

export type AuthErrorResponse = {
  message: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type SessionResponse = {
  user: AuthUser;
};

export const TEST_PASSWORD = "looper1234";

// ponytail: mock 백엔드라 비밀 값을 코드에 둔다. 실제 서비스라면 환경 변수만 허용한다
const sessionSecret = () => process.env.AUTH_SESSION_SECRET ?? "loopers-week09-secret";

export const accounts: AuthUser[] = Array.from({ length: 8 }, (_, index) => ({
  id: `u${index + 1}`,
  name: `루퍼${index + 1}`,
  email: `looper${index + 1}@loopers.dev`,
}));

const authScenarios = ["invalid", "expired", "error", "slow"] as const satisfies
  readonly AuthScenario[];

export const isAuthScenario = (value: string): value is AuthScenario =>
  authScenarios.some((scenario) => scenario === value);

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const findAccount = (email: string, password: string): AuthUser | null => {
  if (password !== TEST_PASSWORD) {
    return null;
  }

  const normalized = email.trim().toLowerCase();
  return accounts.find((account) => account.email === normalized) ?? null;
};

const sign = (payload: string) =>
  createHmac("sha256", sessionSecret()).update(payload).digest("base64url");

export const createSessionToken = (userId: string, nowMs = Date.now()) => {
  const issuedAt = Math.floor(nowMs / 1_000);
  const payload = Buffer.from(
    JSON.stringify({ userId, iat: issuedAt, exp: issuedAt + SESSION_TTL_SECONDS }),
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
};

export const readSessionToken = (
  token: string | undefined,
  nowMs = Date.now(),
): AuthUser | null => {
  if (!token) {
    return null;
  }

  const [payload, signature, ...rest] = token.split(".");
  if (!payload || !signature || rest.length > 0) {
    return null;
  }

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  let parsed: { userId?: unknown; exp?: unknown };
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (typeof parsed.userId !== "string" || typeof parsed.exp !== "number") {
    return null;
  }

  if (parsed.exp * 1_000 <= nowMs) {
    return null;
  }

  const userId = parsed.userId;
  return accounts.find((account) => account.id === userId) ?? null;
};

// 지연은 이 파일에서 처리한다. test 환경에서는 기다리지 않는다
export const waitForAuthApi = (requestedDelayMs = 500) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, process.env.NODE_ENV === "test" ? 0 : requestedDelayMs);
  });
