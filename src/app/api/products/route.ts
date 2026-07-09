import { NextResponse } from "next/server";
import { products } from "./data";

// mock 백엔드 (Next route handler). 데이터는 ./data 단일 출처에서 가져온다.
export async function GET() {
  return NextResponse.json({ products, totalCount: products.length });
}
