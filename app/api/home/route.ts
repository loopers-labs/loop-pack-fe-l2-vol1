import { NextResponse, type NextRequest } from "next/server";

import { waitForMockApi } from "../_mock/catalog";
import { getHomeData } from "../_mock/home";
import type { MockApiScenario } from "../_mock/types";
import type { HomeResponse } from "@/_pages/home";
import type { ApiErrorResponse } from "@/shared/api";

const SCENARIOS = ["empty", "error"] as const satisfies readonly MockApiScenario[];
const isScenario = (value: string): value is MockApiScenario =>
  SCENARIOS.some((scenario) => scenario === value);

// route handler는 어댑터: HTTP 파싱·검증·상태코드·지연만 담당하고 데이터 구성은 mock이 소유한다.
export async function GET(
  request: NextRequest,
): Promise<NextResponse<HomeResponse | ApiErrorResponse>> {
  const scenario = request.nextUrl.searchParams.get("scenario");

  if (scenario !== null && !isScenario(scenario)) {
    return NextResponse.json({ message: "요청 조건을 확인해주세요." }, { status: 400 });
  }

  await waitForMockApi();

  if (scenario === "error") {
    return NextResponse.json({ message: "홈 데이터를 불러오지 못했습니다." }, { status: 500 });
  }

  const home = getHomeData();
  return NextResponse.json(
    scenario === "empty" ? { ...home, popularProducts: [], newProducts: [] } : home,
  );
}
