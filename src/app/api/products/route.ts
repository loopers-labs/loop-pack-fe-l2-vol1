import { NextRequest, NextResponse } from "next/server";
import { categories } from "@/app/api/_data/commerce";
import { MockApiError } from "../_contract";
import type {
  ApiErrorResponse,
  CategoryId,
  MockApiScenario,
  ProductListResponse,
  ProductSort,
} from "@/types/commerce";
import { getProductListResponse } from "./product-list-response";

const sortValues = [
  "latest",
  "popular",
  "price-asc",
  "price-desc",
] as const satisfies readonly ProductSort[];
const scenarioValues = ["empty", "error", "slow"] as const satisfies readonly MockApiScenario[];

const isProductSort = (value: string): value is ProductSort =>
  sortValues.some((sort) => sort === value);

const isMockApiScenario = (value: string): value is MockApiScenario =>
  scenarioValues.some((scenario) => scenario === value);

const isCategoryFilter = (value: string): value is CategoryId | "all" =>
  value === "all" || categories.some((item) => item.id === value);

const isPositiveInteger = (value: string | null) => value !== null && /^[1-9]\d*$/.test(value);

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ProductListResponse | ApiErrorResponse>> {
  const params = request.nextUrl.searchParams;
  const scenario = params.get("scenario");
  const q = params.get("q") ?? "";
  const category = params.get("category");
  const sort = params.get("sort");
  const pageValue = params.get("page") ?? "1";
  const pageSizeValue = params.get("pageSize") ?? "12";
  const page = Number(pageValue);
  const pageSize = Number(pageSizeValue);

  if (scenario !== null && !isMockApiScenario(scenario)) {
    return NextResponse.json({ message: "요청 조건을 확인해주세요." }, { status: 400 });
  }

  if (sort !== null && !isProductSort(sort)) {
    return NextResponse.json({ message: "요청 조건을 확인해주세요." }, { status: 400 });
  }

  if (category !== null && !isCategoryFilter(category)) {
    return NextResponse.json({ message: "요청 조건을 확인해주세요." }, { status: 400 });
  }

  const validPage = isPositiveInteger(pageValue) && Number.isSafeInteger(page);
  const validPageSize =
    isPositiveInteger(pageSizeValue) && Number.isSafeInteger(pageSize) && pageSize <= 24;

  if (!validPage || !validPageSize) {
    return NextResponse.json({ message: "요청 조건을 확인해주세요." }, { status: 400 });
  }

  try {
    return NextResponse.json(
      await getProductListResponse({ q, category, sort, page, pageSize, scenario }),
    );
  } catch (error) {
    if (error instanceof MockApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    throw error;
  }
}
