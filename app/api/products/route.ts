import { NextResponse, type NextRequest } from "next/server";

import {
  isCategoryId,
  isProductSort,
  queryProducts,
  waitForMockApi,
  type ApiErrorResponse,
  type CategoryId,
  type MockApiScenario,
  type ProductListResponse,
  type ProductSort,
} from "@/commerce";

const SCENARIOS = ["empty", "error"] as const satisfies readonly MockApiScenario[];
const isScenario = (value: string): value is MockApiScenario =>
  SCENARIOS.some((scenario) => scenario === value);

const isPositiveInteger = (value: string) => /^[1-9]\d*$/.test(value);

// route handler는 어댑터: raw searchParams를 검증된 쿼리로 번역하거나 400으로 끝내고,
// 검색·정렬·페이지 로직은 commerce.queryProducts가 소유한다.
export async function GET(
  request: NextRequest,
): Promise<NextResponse<ProductListResponse | ApiErrorResponse>> {
  const params = request.nextUrl.searchParams;
  const scenario = params.get("scenario");
  const categoryParam = params.get("category");
  const sortParam = params.get("sort");
  const pageValue = params.get("page") ?? "1";
  const pageSizeValue = params.get("pageSize") ?? "12";
  const page = Number(pageValue);
  const pageSize = Number(pageSizeValue);

  const badRequest = () =>
    NextResponse.json({ message: "요청 조건을 확인해주세요." }, { status: 400 });

  if (scenario !== null && !isScenario(scenario)) {
    return badRequest();
  }
  if (sortParam !== null && !isProductSort(sortParam)) {
    return badRequest();
  }

  const validCategory =
    categoryParam === null || categoryParam === "all" || isCategoryId(categoryParam);
  const validPage = isPositiveInteger(pageValue) && Number.isSafeInteger(page);
  const validPageSize =
    isPositiveInteger(pageSizeValue) && Number.isSafeInteger(pageSize) && pageSize <= 24;

  if (!validCategory || !validPage || !validPageSize) {
    return badRequest();
  }

  await waitForMockApi();

  if (scenario === "error") {
    return NextResponse.json({ message: "상품 목록을 불러오지 못했습니다." }, { status: 500 });
  }

  const category: CategoryId | "all" =
    categoryParam !== null && categoryParam !== "all" && isCategoryId(categoryParam)
      ? categoryParam
      : "all";
  const sort: ProductSort | null =
    sortParam !== null && isProductSort(sortParam) ? sortParam : null;

  const result = queryProducts({ q: params.get("q") ?? "", category, sort, page, pageSize });

  return NextResponse.json(
    scenario === "empty" ? { ...result, products: [], totalCount: 0 } : result,
  );
}
