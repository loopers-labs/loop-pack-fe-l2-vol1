import { NextRequest, NextResponse } from "next/server";
import { waitForMockApi } from "@/app/api/_data/mock";
import { getProductById, getProductList } from "@/app/api/_data/productService";
import {
  PRODUCT_SORTS,
  CATEGORY_OPTIONS,
} from "@/entities/product/model/types";
import type {
  Product,
  ProductListResponse,
  ProductSort,
} from "@/entities/product/model/types";
import type {
  ApiErrorResponse,
  MockApiScenario,
} from "@/types/commerce";
import { parsePositiveInteger } from "@/shared/lib/parsePositiveInteger";

const scenarioValues = ["empty", "error", "slow"] as const satisfies readonly MockApiScenario[];

const isProductSort = (value: string): value is ProductSort =>
  (PRODUCT_SORTS as readonly string[]).includes(value);

const isMockApiScenario = (value: string): value is MockApiScenario =>
  scenarioValues.some((scenario) => scenario === value);

export async function GET(
  request: NextRequest,
): Promise<NextResponse<Product | ProductListResponse | ApiErrorResponse>> {
  const params = request.nextUrl.searchParams;
  const scenario = params.get("scenario");
  const q = params.get("q")?.trim().toLocaleLowerCase("ko") ?? "";
  const category = params.get("category");
  const sort = params.get("sort");
  const pageValue = params.get("page") ?? "1";
  const pageSizeValue = params.get("pageSize") ?? "12";
  const page = parsePositiveInteger(pageValue);
  const pageSize = parsePositiveInteger(pageSizeValue);

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
    (CATEGORY_OPTIONS as readonly string[]).includes(category);
  if (
    !validCategory ||
    page === null ||
    pageSize === null ||
    pageSize > 24
  ) {
    return NextResponse.json(
      { message: "요청 조건을 확인해주세요." },
      { status: 400 },
    );
  }

  const id = params.get("id");

  if (scenario === "slow") {
    await waitForMockApi(1_500);
  } else {
    await waitForMockApi();
  }

  if (id) {
    const product = getProductById(id);
    if (!product) {
      return NextResponse.json(
        { message: "상품을 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    return NextResponse.json(product);
  }

  if (scenario === "error") {
    return NextResponse.json(
      { message: "상품 목록을 불러오지 못했습니다." },
      { status: 500 },
    );
  }

  const data = getProductList({
    q,
    category: category as 'all',
    sort: sort as ProductSort,
    page,
    pageSize,
  });

  if (scenario === "empty") {
    return NextResponse.json({ ...data, products: [], totalCount: 0 });
  }

  return NextResponse.json(data);
}
