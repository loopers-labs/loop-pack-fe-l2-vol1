import { NextResponse } from "next/server";

import type { ProductCatalog } from "@/types/product";

// mock 백엔드 (Next route handler). 실제 DB 대신 여기서 데이터를 내려준다.
// 데모 화면(select1~3.png)과 동일한 세 상품의 옵션을 제공한다.
const catalog: ProductCatalog = {
  // select3.png — 텍스트 옵션 2개
  bundles: [
    {
      id: "bagel-55",
      name: "[최대할인] 베이글 5+5개",
      price: 21000,
      unitCount: 10,
      freeShipping: true,
    },
    {
      id: "bagel-1",
      name: "베이글 1개",
      price: 4200,
      unitCount: 1,
      freeShipping: false,
    },
  ],

  // select1.png — 사이즈 옵션 5개 (28은 품절: 키보드 스킵 검증용)
  sneakers: {
    id: "sneakers-daily",
    name: "데일리 스니커즈",
    sizes: [
      { value: 24, stock: 3 },
      { value: 25, stock: 5 },
      { value: 26, stock: 12 },
      { value: 27, stock: 2 },
      { value: 28, stock: 0 },
    ],
  },

  // select2.png — 썸네일 옵션 2개
  ampoules: [
    {
      id: "ampoule-100",
      name: "그로우턴 앰플 100ml기획(+100ml)",
      price: 38800,
      originalPrice: 39600,
      image: "/globe.svg",
      todayDelivery: true,
    },
    {
      id: "ampoule-130",
      name: "그로우턴 앰플 130ml기획(+30ml)",
      price: 33800,
      originalPrice: 34500,
      image: "/window.svg",
      todayDelivery: true,
    },
  ],
};

export async function GET() {
  return NextResponse.json(catalog);
}
