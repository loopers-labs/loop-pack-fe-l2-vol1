import { NextResponse } from "next/server";

// mock 백엔드 (Next route handler). 실제 DB 대신 여기서 데이터를 내려준다.
// 필요하면 자유롭게 늘리거나 구조를 바꿔도 된다.
const products = [
  {
    id: "p1",
    name: "베이글 플레인",
    price: 3200,
    originalPrice: 4000,
    image: "/next.svg",
    freeShipping: true,
    sizes: [
      { value: 24, stock: 3 },
      { value: 25, stock: 0 },
      { value: 26, stock: 12 },
      { value: 27, stock: 5 },
      { value: 28, stock: 0 },
    ],
  },
  {
    id: "p2",
    name: "에브리씽 베이글",
    price: 3800,
    originalPrice: null,
    image: "/next.svg",
    freeShipping: false,
    sizes: [],
  },
];

export async function GET() {
  return NextResponse.json({ products, totalCount: products.length });
}
