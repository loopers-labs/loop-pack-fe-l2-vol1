import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

// DLC starter fixture only. This monolithic file is not the target auth package or
// a suggested Public API. During the assignment, students must decide which pure
// policy belongs in a package and keep cookie/request composition inside each app.

export type DlcApp = "web" | "admin";
export type DlcAudience = DlcApp;
export type DlcRole = "customer" | "admin";
export type DlcAccountAlias = "customer-a" | "customer-b" | "admin-a" | "admin-b";

export type DlcAccount = {
  alias: DlcAccountAlias;
  id: string;
  name: string;
  role: DlcRole;
};

type SessionPayload = {
  sub: string;
  alias: DlcAccountAlias;
  role: DlcRole;
  aud: DlcAudience;
  iat: number;
  exp: number;
};

export const DLC_ACCOUNTS: Record<DlcAccountAlias, DlcAccount> = {
  "customer-a": {
    alias: "customer-a",
    id: "dlc-customer-a",
    name: "고객 A",
    role: "customer",
  },
  "customer-b": {
    alias: "customer-b",
    id: "dlc-customer-b",
    name: "고객 B",
    role: "customer",
  },
  "admin-a": {
    alias: "admin-a",
    id: "dlc-admin-a",
    name: "운영자 A",
    role: "admin",
  },
  "admin-b": {
    alias: "admin-b",
    id: "dlc-admin-b",
    name: "운영자 B",
    role: "admin",
  },
};

export const DLC_SESSION_COOKIE: Record<DlcApp, string> = {
  web: "dlc_web_session",
  admin: "dlc_admin_session",
};

export const DLC_SESSION_TTL_SECONDS = 60 * 60;

const expectedRole: Record<DlcApp, DlcRole> = {
  web: "customer",
  admin: "admin",
};

const secretName: Record<DlcApp, "WEB_SESSION_SECRET" | "ADMIN_SESSION_SECRET"> = {
  web: "WEB_SESSION_SECRET",
  admin: "ADMIN_SESSION_SECRET",
};

export class DlcConfigurationError extends Error {}

const signingSecret = (app: DlcApp): string => {
  const name = secretName[app];
  const secret = process.env[name];
  if (!secret) {
    throw new DlcConfigurationError(`${name} is required`);
  }
  return secret;
};

const sign = (encodedPayload: string, app: DlcApp) =>
  createHmac("sha256", signingSecret(app)).update(encodedPayload).digest("base64url");

const safeEqual = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
  );
};

export const isDlcApp = (value: unknown): value is DlcApp =>
  value === "web" || value === "admin";

export const isDlcAudience = (value: unknown): value is DlcAudience => isDlcApp(value);

export const isDlcAccountAlias = (value: unknown): value is DlcAccountAlias =>
  typeof value === "string" && Object.hasOwn(DLC_ACCOUNTS, value);

export function createDlcSessionToken({
  accountAlias,
  signingApp,
  audience = signingApp,
  nowMs = Date.now(),
}: {
  accountAlias: DlcAccountAlias;
  signingApp: DlcApp;
  audience?: DlcAudience;
  nowMs?: number;
}): string {
  const account = DLC_ACCOUNTS[accountAlias];
  const issuedAt = Math.floor(nowMs / 1_000);
  const payload: SessionPayload = {
    sub: account.id,
    alias: account.alias,
    role: account.role,
    aud: audience,
    iat: issuedAt,
    exp: issuedAt + DLC_SESSION_TTL_SECONDS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload, signingApp)}`;
}

export function verifyDlcSessionToken(
  token: string | undefined,
  expectedApp: DlcApp,
  nowMs = Date.now(),
): DlcAccount | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature, ...rest] = token.split(".");
  if (!encodedPayload || !signature || rest.length > 0) {
    return null;
  }

  let expectedSignature: string;
  try {
    expectedSignature = sign(encodedPayload, expectedApp);
  } catch (error) {
    if (error instanceof DlcConfigurationError) {
      throw error;
    }
    return null;
  }
  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  let payload: Partial<SessionPayload>;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (
    !isDlcAccountAlias(payload.alias) ||
    payload.aud !== expectedApp ||
    payload.role !== expectedRole[expectedApp] ||
    typeof payload.exp !== "number" ||
    payload.exp * 1_000 <= nowMs
  ) {
    return null;
  }

  const account = DLC_ACCOUNTS[payload.alias];
  if (payload.sub !== account.id || payload.role !== account.role) {
    return null;
  }
  return account;
}

const INSTANCE_ID = randomUUID();

export const dlcResponseHeaders = (request: Request): HeadersInit => ({
  "x-dlc-instance-id": INSTANCE_ID,
  "x-dlc-request-id": request.headers.get("x-dlc-request-id") ?? randomUUID(),
});

export const hasDlcSessionConfiguration = (app: DlcApp): boolean =>
  Boolean(process.env[secretName[app]]);
