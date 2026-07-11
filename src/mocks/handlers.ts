import { http, HttpResponse } from "msw";

// DEST 최소 목: app/api/products/route.ts 응답 형태(products, totalCount)를 그대로 따른다.
export const handlers = [
  http.get("/api/products", () => {
    const products = [
      {
        id: "p1",
        name: "베이글 플레인",
        price: 3200,
        originalPrice: 4000,
        image: "/next.svg",
        freeShipping: true,
        sizes: [{ value: 24, stock: 3 }],
      },
    ];

    return HttpResponse.json({ products, totalCount: products.length });
  }),
];
