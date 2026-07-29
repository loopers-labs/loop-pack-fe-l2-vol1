import { NextRequest, NextResponse } from "next/server";
import { waitForMockApi } from "@/app/api/_data/commerce";
import { getHomeData } from "@/app/api/_data/homeService";
import type { ApiErrorResponse, HomeResponse, MockApiScenario } from "@/types/commerce";

const scenarioValues = ["empty", "error"] as const satisfies readonly MockApiScenario[];

const isMockApiScenario = (value: string): value is MockApiScenario =>
  scenarioValues.some((scenario) => scenario === value);

export async function GET(
  request: NextRequest,
): Promise<NextResponse<HomeResponse | ApiErrorResponse>> {
  const scenario = request.nextUrl.searchParams.get("scenario");

  if (scenario !== null && !isMockApiScenario(scenario)) {
    return NextResponse.json(
      { message: "요청 조건을 확인해주세요." },
      { status: 400 },
    );
  }

  await waitForMockApi();

  if (scenario === "error") {
    return NextResponse.json(
      { message: "홈 데이터를 불러오지 못했습니다." },
      { status: 500 },
    );
  }

  const data = getHomeData();

  if (scenario === "empty") {
    return NextResponse.json({
      ...data,
      popularProducts: [],
      newProducts: [],
    });
  }

  return NextResponse.json(data);
}
