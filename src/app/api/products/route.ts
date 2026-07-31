import { NextRequest, NextResponse } from "next/server";
import {
  getProductListData,
  isProductCategory,
  MockApiScenarioError,
} from "@/app/api/_data/commerce.server";
import type {
  ApiErrorResponse,
  MockApiScenario,
  ProductListResponse,
  ProductSort,
} from "@/types/commerce";

const sortValues = ["latest", "popular", "price-asc", "price-desc"] as const satisfies
  readonly ProductSort[];
const scenarioValues = ["empty", "error", "slow"] as const satisfies readonly MockApiScenario[];

const isProductSort = (value: string): value is ProductSort =>
  sortValues.some((sort) => sort === value);

const isMockApiScenario = (value: string): value is MockApiScenario =>
  scenarioValues.some((scenario) => scenario === value);

const isPositiveInteger = (value: string | null) =>
  value !== null && /^[1-9]\d*$/.test(value);

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ProductListResponse | ApiErrorResponse>> {
  const params = request.nextUrl.searchParams;
  const scenario = params.get("scenario");
  const q = params.get("q")?.trim().toLocaleLowerCase("ko") ?? "";
  const category = params.get("category");
  const sort = params.get("sort");
  const pageValue = params.get("page") ?? "1";
  const pageSizeValue = params.get("pageSize") ?? "12";
  const page = Number(pageValue);
  const pageSize = Number(pageSizeValue);

  if (scenario !== null && !isMockApiScenario(scenario)) {
    return NextResponse.json(
      { message: "요청 조건을 확인해주세요." },
      { status: 400 },
    );
  }

  if (sort !== null && !isProductSort(sort)) {
    return NextResponse.json(
      { message: "요청 조건을 확인해주세요." },
      { status: 400 },
    );
  }

  const validCategory =
    category === null ||
    category === "all" ||
    isProductCategory(category);
  const validPage = isPositiveInteger(pageValue) && Number.isSafeInteger(page);
  const validPageSize =
    isPositiveInteger(pageSizeValue) && Number.isSafeInteger(pageSize) && pageSize <= 24;

  if (!validCategory || !validPage || !validPageSize) {
    return NextResponse.json(
      { message: "요청 조건을 확인해주세요." },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(
      await getProductListData({
        q,
        category,
        sort,
        page,
        pageSize,
        scenario,
      }),
    );
  } catch (error) {
    if (!(error instanceof MockApiScenarioError)) {
      throw error;
    }

    return NextResponse.json(
      { message: "상품 목록을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
