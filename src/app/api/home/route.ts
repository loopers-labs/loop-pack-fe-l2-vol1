import { NextRequest, NextResponse } from "next/server";
import type { ApiErrorResponse, HomeResponse, MockApiScenario } from "@/types/commerce";
import { MockApiError } from "../_contract";
import { getHomeResponse } from "./home-response";

const scenarioValues = ["empty", "error", "slow"] as const satisfies readonly MockApiScenario[];

const isMockApiScenario = (value: string): value is MockApiScenario =>
  scenarioValues.some((scenario) => scenario === value);

export async function GET(
  request: NextRequest,
): Promise<NextResponse<HomeResponse | ApiErrorResponse>> {
  const scenario = request.nextUrl.searchParams.get("scenario");

  if (scenario !== null && !isMockApiScenario(scenario)) {
    return NextResponse.json({ message: "요청 조건을 확인해주세요." }, { status: 400 });
  }

  try {
    return NextResponse.json(await getHomeResponse(scenario));
  } catch (error) {
    if (error instanceof MockApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    throw error;
  }
}
