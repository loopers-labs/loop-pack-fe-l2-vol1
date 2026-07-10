import { NextRequest, NextResponse } from "next/server";
import { categories, products, waitForMockApi } from "@/app/api/_data/commerce";
import type { ApiErrorResponse, ProductListResponse, ProductSort } from "@/types/commerce";

const sortValues: ProductSort[] = ["latest", "popular", "price-asc", "price-desc"];

const isPositiveInteger = (value: string | null) =>
  value !== null && /^[1-9]\d*$/.test(value);

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ProductListResponse | ApiErrorResponse>> {
  await waitForMockApi();

  const params = request.nextUrl.searchParams;
  const scenario = params.get("scenario");

  if (scenario === "error") {
    return NextResponse.json(
      { message: "상품 목록을 불러오지 못했습니다." },
      { status: 500 },
    );
  }

  const q = params.get("q")?.trim().toLocaleLowerCase("ko") ?? "";
  const category = params.get("category");
  const sort = params.get("sort");
  const pageValue = params.get("page") ?? "1";
  const pageSizeValue = params.get("pageSize") ?? "12";

  const validCategory =
    category === null ||
    category === "all" ||
    categories.some((item) => item.id === category);
  const validSort = sort === null || sortValues.includes(sort as ProductSort);
  const validPage = isPositiveInteger(pageValue);
  const validPageSize =
    isPositiveInteger(pageSizeValue) && Number(pageSizeValue) <= 24;

  if (!validCategory || !validSort || !validPage || !validPageSize) {
    return NextResponse.json(
      { message: "요청 조건을 확인해주세요." },
      { status: 400 },
    );
  }

  const page = Number(pageValue);
  const pageSize = Number(pageSizeValue);

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      category === null || category === "all" || product.category === category;
    const searchable = `${product.brand} ${product.name}`.toLocaleLowerCase("ko");
    return matchesCategory && searchable.includes(q);
  });

  const sortedProducts = [...filteredProducts];

  if (sort !== null) {
    sortedProducts.sort((a, b) => {
      switch (sort as ProductSort) {
        case "popular":
          return b.reviewCount - a.reviewCount || b.rating - a.rating;
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "latest":
          return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      }
    });
  }

  const start = (page - 1) * pageSize;
  const pagedProducts = sortedProducts.slice(start, start + pageSize);
  const responseProducts = scenario === "empty" ? [] : pagedProducts;
  const totalCount = scenario === "empty" ? 0 : filteredProducts.length;

  return NextResponse.json({
    products: responseProducts,
    categories,
    totalCount,
    page,
    pageSize,
  });
}
