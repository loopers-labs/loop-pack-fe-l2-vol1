import { NextRequest, NextResponse } from "next/server";
import { internalGraderDenial } from "@/dlc-starter/internal-grader";
import {
  createDlcSessionToken,
  DLC_SESSION_COOKIE,
  DLC_SESSION_TTL_SECONDS,
  isDlcAccountAlias,
  isDlcApp,
  isDlcAudience,
} from "@/dlc-starter/session";

export async function POST(request: NextRequest) {
  const denial = internalGraderDenial(request);
  if (denial) {
    return denial;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "invalid fixture request" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ message: "invalid fixture request" }, { status: 400 });
  }

  const values = body as Record<string, unknown>;
  if (
    !isDlcAccountAlias(values.account) ||
    !isDlcApp(values.signingApp) ||
    (values.audience !== undefined && !isDlcAudience(values.audience))
  ) {
    return NextResponse.json({ message: "invalid fixture request" }, { status: 400 });
  }

  const token = createDlcSessionToken({
    accountAlias: values.account,
    signingApp: values.signingApp,
    audience: values.audience,
  });
  const cookieName = DLC_SESSION_COOKIE[values.signingApp];
  const response = NextResponse.json({
    account: values.account,
    signingApp: values.signingApp,
    audience: values.audience ?? values.signingApp,
    cookieName,
    token,
  });
  response.cookies.set({
    name: cookieName,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: DLC_SESSION_TTL_SECONDS,
    secure: request.nextUrl.protocol === "https:",
  });
  return response;
}
