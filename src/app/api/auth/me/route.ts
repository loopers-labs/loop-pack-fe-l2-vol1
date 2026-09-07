import { NextRequest, NextResponse } from "next/server";
import {
  isAuthScenario,
  readSessionToken,
  waitForAuthApi,
} from "@/app/api/_data/auth";
import { SCENARIO_COOKIE, SESSION_COOKIE } from "@/app/api/_data/auth-cookies";
import type { AuthErrorResponse, SessionResponse } from "@/app/api/_data/auth";

export async function GET(
  request: NextRequest,
): Promise<NextResponse<SessionResponse | AuthErrorResponse>> {
  const scenario =
    request.nextUrl.searchParams.get("scenario") ??
    request.cookies.get(SCENARIO_COOKIE)?.value ??
    null;

  if (scenario !== null && !isAuthScenario(scenario)) {
    return NextResponse.json({ message: "요청 조건을 확인해주세요." }, { status: 400 });
  }

  await waitForAuthApi(scenario === "slow" ? 1_500 : 500);

  if (scenario === "error") {
    return NextResponse.json({ message: "세션을 확인하지 못했습니다." }, { status: 500 });
  }

  const user =
    scenario === "expired"
      ? null
      : readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (user === null) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  return NextResponse.json({ user });
}
