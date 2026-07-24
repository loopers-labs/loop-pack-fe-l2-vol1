import { NextResponse } from "next/server";

import { productCatalog } from "@/products";

// route handler는 어댑터: 데이터·검증은 products 피처가 소유하고, 여기서는 직렬화만 한다.
export async function GET() {
  return NextResponse.json({ products: productCatalog, totalCount: productCatalog.length });
}
