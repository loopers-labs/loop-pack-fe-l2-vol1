import { NextRequest, NextResponse } from "next/server";
import {
  getHomeData,
  MockApiScenarioError,
} from "@/app/api/_data/commerce.server";
import type { ApiErrorResponse, HomeResponse, MockApiScenario } from "@/types/commerce";

const scenarioValues = ["empty", "error", "slow"] as const satisfies readonly MockApiScenario[];

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

  try {
    return NextResponse.json(await getHomeData(scenario));
  } catch (error) {
    if (!(error instanceof MockApiScenarioError)) {
      throw error;
    }

    return NextResponse.json(
      { message: "홈 데이터를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
