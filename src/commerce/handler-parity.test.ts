import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET as getProducts } from "../../app/api/products/route";
import type { ProductListResponse } from "@/commerce";

// mocks/handlers.ts의 /api/products는 실제 route.ts GET에 위임한다.
// 이 스위트는 그 위임이 유지됨을 대조한다 — 누군가 편의로 핸들러에
// 응답을 직접 합성하거나 기본값을 끼워 넣으면(sort ?? "latest" 등) 여기서 떨어진다.
// mocks/handlers.ts 자체는 이 스위트가 고칠 대상이 아니다 — 실패는 보고 대상이다.

type ParityResult = {
  status: number;
  totalCount: number | null;
  ids: string[] | null;
};

async function toParityResult(res: Response): Promise<ParityResult> {
  if (res.status !== 200) {
    return { status: res.status, totalCount: null, ids: null };
  }
  const body: ProductListResponse = await res.json();
  return {
    status: res.status,
    totalCount: body.totalCount,
    ids: body.products.map((product) => product.id),
  };
}

// 핸들러 경로: fetch가 MSW에 가로채여 위임된다(mocks/setup.ts의 beforeAll(server.listen)).
async function fetchViaHandler(query: string): Promise<ParityResult> {
  const res = await fetch(`/api/products${query}`);
  return toParityResult(res);
}

// 라우트 경로: route.ts GET을 직접 호출한다. NextRequest는 절대 URL이 필요하다.
async function fetchViaRoute(query: string): Promise<ParityResult> {
  const res = await getProducts(new NextRequest(`http://localhost:3000/api/products${query}`));
  return toParityResult(res);
}

type ParityCase = {
  label: string;
  query: string;
  status: number;
  totalCount: number | null;
  ids: string[] | null;
};

// 실측 대조표. 값을 바꾸지 마라 — 특히 1번과 4번은 totalCount가 같아도(30)
// id 배열이 달라야 한다: 1번은 sort=null 분기로 mock DB 원래 순서, 4번은 인기순 정렬.
// 핸들러가 임의 기본값(sort ?? "latest" 등)을 끼워 넣으면 이 둘이 같아지며 여기서 떨어진다.
const cases: ParityCase[] = [
  {
    label: "쿼리 없음",
    query: "",
    status: 200,
    totalCount: 30,
    ids: ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10", "p11", "p12"],
  },
  {
    label: "q=e&sort=price-asc&page=2",
    query: "?q=e&sort=price-asc&page=2",
    status: 200,
    totalCount: 24,
    ids: ["p19", "p6", "p13", "p26", "p1", "p10", "p8", "p5", "p4", "p18", "p27", "p7"],
  },
  {
    label: "category=digital",
    query: "?category=digital",
    status: 200,
    totalCount: 6,
    ids: ["p21", "p22", "p23", "p24", "p25", "p30"],
  },
  {
    label: "sort=popular",
    query: "?sort=popular",
    status: 200,
    totalCount: 30,
    ids: ["p21", "p11", "p15", "p8", "p22", "p30", "p14", "p18", "p6", "p12", "p23", "p16"],
  },
  {
    label: "q=스탠리&page=2",
    query: "?q=스탠리&page=2",
    status: 200,
    totalCount: 4,
    ids: [],
  },
  {
    label: "page=999",
    query: "?page=999",
    status: 200,
    totalCount: 30,
    ids: [],
  },
  {
    label: "category=bogus",
    query: "?category=bogus",
    status: 400,
    totalCount: null,
    ids: null,
  },
];

describe("handler-parity", () => {
  it.each(cases)(
    "$label ($query) — 핸들러 위임과 라우트 직접 호출이 같은 계약을 낸다",
    async ({ query, status, totalCount, ids }) => {
      const expected = { status, totalCount, ids };

      const viaHandler = await fetchViaHandler(query);
      const viaRoute = await fetchViaRoute(query);

      expect(viaHandler).toEqual(expected);
      expect(viaRoute).toEqual(expected);
      expect(viaHandler).toEqual(viaRoute);
    },
  );
});
