import { createHmac, timingSafeEqual } from "node:crypto";
import { products } from "@/app/api/_data/commerce";

// 인증 응답 계약. 6주차에 src/types를 해체한 구조에서도 그대로 쓸 수 있게
// 이 파일에 함께 둔다. 본인 구조에 맞는 자리로 옮겨도 된다
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

export type OrderItem = {
  productId: string;
  quantity: number;
};

export type Order = {
  id: string;
  createdAt: string;
  items: OrderItem[];
  totalPrice: number;
};

export type OrderCreateRequest = {
  items: OrderItem[];
};

export type OrderCreateResponse = {
  order: Order;
};

export type OrderListResponse = {
  orders: Order[];
};

export const SESSION_COOKIE = "session";
export const SCENARIO_COOKIE = "scenario";
export const SESSION_TTL_SECONDS = 60 * 60;
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

// ponytail: 프로세스 메모리에만 담는다. 서버를 재시작하면 초기화된다.
// 영속이 필요해지면 파일이나 DB로 올린다
const ordersByUser = new Map<string, Order[]>();
let orderSequence = 0;

export const addOrder = (userId: string, items: OrderItem[]): Order => {
  orderSequence += 1;
  const totalPrice = items.reduce((sum, item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    return sum + (product?.price ?? 0) * item.quantity;
  }, 0);

  const order: Order = {
    id: `o${orderSequence}`,
    createdAt: new Date().toISOString(),
    items,
    totalPrice,
  };

  ordersByUser.set(userId, [...(ordersByUser.get(userId) ?? []), order]);
  return order;
};

export const listOrders = (userId: string): Order[] => ordersByUser.get(userId) ?? [];

export const resetOrders = () => {
  ordersByUser.clear();
  orderSequence = 0;
};

export const isKnownProductId = (productId: string) =>
  products.some((product) => product.id === productId);
