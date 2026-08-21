import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  findAccount,
  isAuthScenario,
  isRecord,
  waitForAuthApi,
} from "@/app/api/_data/auth";
import {
  SCENARIO_COOKIE,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
} from "@/app/api/_data/auth-cookies";
import type { AuthErrorResponse, SessionResponse } from "@/app/api/_data/auth";

export async function POST(
  request: NextRequest,
): Promise<NextResponse<SessionResponse | AuthErrorResponse>> {
  const scenario =
    request.nextUrl.searchParams.get("scenario") ??
    request.cookies.get(SCENARIO_COOKIE)?.value ??
    null;

  if (scenario !== null && !isAuthScenario(scenario)) {
    return NextResponse.json({ message: "요청 조건을 확인해주세요." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "요청 조건을 확인해주세요." }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ message: "요청 조건을 확인해주세요." }, { status: 400 });
  }

  const { email, password } = body;
  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ message: "요청 조건을 확인해주세요." }, { status: 400 });
  }

  await waitForAuthApi(scenario === "slow" ? 1_500 : 500);

  if (scenario === "error") {
    return NextResponse.json({ message: "로그인에 실패했습니다." }, { status: 500 });
  }

  const user = scenario === "invalid" ? null : findAccount(email, password);
  if (user === null) {
    return NextResponse.json(
      { message: "이메일 또는 비밀번호를 확인해주세요." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ user });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: createSessionToken(user.id),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
    // E2E는 production build를 http://localhost에서 실행한다. https일 때만 secure를 켠다
    secure: request.nextUrl.protocol === "https:",
  });

  return response;
}
