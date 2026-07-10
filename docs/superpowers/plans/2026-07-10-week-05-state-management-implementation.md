# Week 05 State Management Assignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Week 05 state-management assignment infrastructure: simple App Router mock APIs, commerce fixtures and types, optional static layout examples, required dependencies, and the Korean assignment guide.

**Architecture:** Keep the Week 04 style: thin `route.ts` handlers using `NextResponse.json`, camelCase response fields, and no controller/repository framework. Put shared mock constants in one private API data module, public response contracts in one type file, and non-routed layout examples under `src/examples/week-05-layout` so existing student pages are never overwritten.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, TanStack Query v5, nuqs, Zustand, Vitest, pnpm.

## Global Constraints

- Base all implementation work on the current `origin/main`, not the local `main` that is ahead 2, behind 2.
- Preserve the user's existing `.gitignore` modification; do not stage, restore, or overwrite it.
- Before Task 1, use `superpowers:using-git-worktrees` to create an isolated worktree and `codex/week-05-state-management-assignment` from `origin/main`.
- Cherry-pick design commits `e46e34a` and `3c2450d` into the isolated branch before implementation.
- Keep Next.js App Router `route.ts`, `NextResponse.json`, double quotes, semicolons, and camelCase naming from Week 04.
- Do not add MSW, Pages Router, styled-components, Emotion, Axios, a monorepo layer, or application Query/Zustand/nuqs implementations.
- Do not implement QueryClientProvider, NuqsAdapter, query factories, Zustand stores, selectors, or connected page components for students.
- Existing `src/app/page.tsx`, `src/app/layout.tsx`, and `src/components/**` must not be replaced by the Week 05 layout examples.
- The API preserves Week 04 product fields: `id`, `name`, `price`, `originalPrice`, `image`, `freeShipping`, and `sizes`.
- Basic assignment scope treats cart and wishlist as anonymous, non-server-synchronized Zustand state.

---

## Target File Map

- Modify `package.json`: add runtime learning dependencies and Vitest scripts.
- Modify `pnpm-lock.yaml`: lock dependency versions produced by pnpm.
- Create `vitest.config.ts`: Node test environment and `@/` alias resolution.
- Create `src/types/commerce.ts`: public mock API request/response contracts.
- Create `src/app/api/_data/commerce.ts`: categories, banner, 30 deterministic products, delay helper.
- Modify `src/app/api/products/route.ts`: search, category, sort, pagination, scenarios, validation.
- Create `src/app/api/products/route.test.ts`: product endpoint contract tests.
- Create `src/app/api/home/route.ts`: home aggregate endpoint.
- Create `src/app/api/home/route.test.ts`: home endpoint contract tests.
- Create `public/images/products/{food,fashion,beauty,home,digital}.svg`: local category artwork.
- Create `src/examples/week-05-layout/HomeLayoutExample.tsx`: static home layout only.
- Create `src/examples/week-05-layout/ProductListLayoutExample.tsx`: static product-list layout only.
- Create `src/examples/week-05-layout/week-05-layout.css`: minimal example styling.
- Create `src/examples/week-05-layout/README.md`: opt-in usage and replacement notice.
- Create `docs/assignments/week-05.md`: Korean assignment requirements and API contract.
- Modify `README.md`: add only the Week 05 assignment link.

---

### Task 1: Install the learning and verification dependencies

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `vitest.config.ts`

**Interfaces:**
- Produces: installed `@tanstack/react-query`, `nuqs`, `zustand`, and `vitest`; `pnpm test` runs `vitest run`.

- [ ] **Step 1: Verify the isolated checkout**

Run:

```bash
git branch --show-current
git status --short --branch
git log -3 --oneline
```

Expected: branch is `codex/week-05-state-management-assignment`; the worktree is clean; `e46e34a` and `3c2450d` are present above `origin/main`.

- [ ] **Step 2: Install required packages**

Run:

```bash
pnpm add @tanstack/react-query@^5 nuqs@^2 zustand@^5
pnpm add -D vitest
```

Expected: commands exit 0 and update `package.json` plus `pnpm-lock.yaml`.

- [ ] **Step 3: Add the test script**

Modify `package.json` scripts to include:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

Keep pnpm's installed dependency versions exactly as written by the package manager.

- [ ] **Step 4: Configure Vitest for the repository alias**

Create `vitest.config.ts`:

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 5: Verify the package setup**

Run:

```bash
pnpm exec vitest --version
pnpm lint
```

Expected: Vitest prints a version; lint exits 0.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts
git commit -m "chore: 5주차 상태관리 의존성 추가"
```

---

### Task 2: Define the commerce API contracts and deterministic fixtures

**Files:**
- Create: `src/types/commerce.ts`
- Create: `src/app/api/_data/commerce.ts`
- Create: `public/images/products/food.svg`
- Create: `public/images/products/fashion.svg`
- Create: `public/images/products/beauty.svg`
- Create: `public/images/products/home.svg`
- Create: `public/images/products/digital.svg`

**Interfaces:**
- Produces: `CategoryId`, `Category`, `ProductSort`, `ApiScenario`, `HomeQuery`, `ProductListQuery`, `Product`, `HomeResponse`, `ProductListResponse`, `ApiErrorResponse`.
- Produces: `categories`, `products`, `homeBanner`, `waitForMockApi()` used by both Route Handlers.

- [ ] **Step 1: Create the public API types**

Create `src/types/commerce.ts`:

```ts
export type CategoryId = "food" | "fashion" | "beauty" | "home" | "digital";

export type Category = {
  id: CategoryId;
  name: string;
};

export type ProductSort = "latest" | "popular" | "price-asc" | "price-desc";

export type ApiScenario = "empty" | "error";

export type HomeQuery = {
  scenario?: ApiScenario;
};

export type ProductListQuery = {
  q?: string;
  category?: CategoryId | "all";
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
  scenario?: ApiScenario;
};

export type Product = {
  id: string;
  brand: string;
  name: string;
  category: CategoryId;
  price: number;
  originalPrice: number | null;
  image: string;
  freeShipping: boolean;
  sizes: Array<{ value: number; stock: number }>;
  rating: number;
  reviewCount: number;
  createdAt: string;
};

export type HomeResponse = {
  banner: { title: string; description: string; image: string };
  categories: Category[];
  popularProducts: Product[];
  newProducts: Product[];
};

export type ProductListResponse = {
  products: Product[];
  categories: Category[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type ApiErrorResponse = {
  message: string;
};
```

- [ ] **Step 2: Create deterministic commerce fixtures**

Create `src/app/api/_data/commerce.ts` with the complete seed list below. It intentionally remains a plain data module rather than a repository abstraction.

```ts
import type { Category, CategoryId, Product } from "@/types/commerce";

export const categories: Category[] = [
  { id: "food", name: "푸드" },
  { id: "fashion", name: "패션" },
  { id: "beauty", name: "뷰티" },
  { id: "home", name: "홈" },
  { id: "digital", name: "디지털" },
];

export const homeBanner = {
  title: "매일 새롭게 발견하는 취향",
  description: "지금 가장 사랑받는 상품을 만나보세요.",
  image: "/images/products/fashion.svg",
};

type ProductSeed = readonly [
  id: string,
  brand: string,
  name: string,
  category: CategoryId,
  price: number,
  originalPrice: number | null,
  rating: number,
  reviewCount: number,
  createdAt: string,
];

const seeds: ProductSeed[] = [
  ["p1", "루프베이크", "베이글 플레인", "food", 3200, 4000, 4.8, 312, "2026-07-09T09:00:00.000Z"],
  ["p2", "루프베이크", "에브리씽 베이글", "food", 3800, null, 4.6, 184, "2026-07-08T09:00:00.000Z"],
  ["p3", "오후의식탁", "바질 토마토 스프레드", "food", 12900, 15900, 4.7, 98, "2026-07-06T09:00:00.000Z"],
  ["p4", "밀크앤허니", "그래놀라 허니넛", "food", 8900, null, 4.5, 221, "2026-06-28T09:00:00.000Z"],
  ["p5", "소일", "콜드브루 원액", "food", 16000, 19000, 4.9, 410, "2026-06-25T09:00:00.000Z"],
  ["p6", "데일리무드", "오버핏 코튼 셔츠", "fashion", 59000, 79000, 4.7, 520, "2026-07-10T09:00:00.000Z"],
  ["p7", "모노워크", "와이드 데님 팬츠", "fashion", 69000, null, 4.5, 268, "2026-07-05T09:00:00.000Z"],
  ["p8", "아카이브", "미니멀 레더 백", "fashion", 119000, 149000, 4.8, 706, "2026-06-30T09:00:00.000Z"],
  ["p9", "선데이클럽", "리넨 카디건", "fashion", 78000, null, 4.4, 129, "2026-07-02T09:00:00.000Z"],
  ["p10", "워크룸", "클래식 러너 스니커즈", "fashion", 139000, 169000, 4.6, 344, "2026-06-21T09:00:00.000Z"],
  ["p11", "브리즈랩", "수분 진정 세럼", "beauty", 28000, 35000, 4.9, 990, "2026-07-07T09:00:00.000Z"],
  ["p12", "누드톤", "벨벳 립 틴트", "beauty", 19000, null, 4.3, 473, "2026-07-03T09:00:00.000Z"],
  ["p13", "오브제", "퍼퓸 핸드크림", "beauty", 17000, 22000, 4.6, 285, "2026-06-29T09:00:00.000Z"],
  ["p14", "퓨어데이", "약산성 클렌징 젤", "beauty", 24000, null, 4.7, 611, "2026-06-18T09:00:00.000Z"],
  ["p15", "레이어", "데일리 선크림", "beauty", 26000, 32000, 4.8, 804, "2026-07-01T09:00:00.000Z"],
  ["p16", "스테이홈", "워셔블 코튼 베딩", "home", 129000, 159000, 4.8, 418, "2026-07-04T09:00:00.000Z"],
  ["p17", "우드앤", "오크 사이드 테이블", "home", 189000, null, 4.5, 177, "2026-06-20T09:00:00.000Z"],
  ["p18", "룸센트", "시더우드 디퓨저", "home", 39000, 49000, 4.4, 533, "2026-06-27T09:00:00.000Z"],
  ["p19", "소프트룸", "라운드 쿠션 세트", "home", 45000, null, 4.2, 92, "2026-07-08T12:00:00.000Z"],
  ["p20", "키친노트", "내열 유리컵 4P", "home", 32000, 42000, 4.7, 364, "2026-06-24T09:00:00.000Z"],
  ["p21", "플로우", "무선 노이즈캔슬링 헤드폰", "digital", 289000, 349000, 4.9, 1230, "2026-06-26T09:00:00.000Z"],
  ["p22", "키랩", "미니 기계식 키보드", "digital", 149000, null, 4.6, 689, "2026-07-06T12:00:00.000Z"],
  ["p23", "오디오룸", "블루투스 스피커", "digital", 99000, 129000, 4.5, 444, "2026-06-17T09:00:00.000Z"],
  ["p24", "픽셀", "4K 포터블 모니터", "digital", 329000, null, 4.7, 298, "2026-07-09T12:00:00.000Z"],
  ["p25", "차지온", "3-in-1 충전 스탠드", "digital", 79000, 99000, 4.3, 375, "2026-06-23T09:00:00.000Z"],
  ["p26", "루프베이크", "시나몬 크림 베이글", "food", 4500, null, 4.5, 88, "2026-07-10T12:00:00.000Z"],
  ["p27", "데일리무드", "라이트 윈드 재킷", "fashion", 89000, 119000, 4.4, 151, "2026-07-09T15:00:00.000Z"],
  ["p28", "브리즈랩", "시카 토너 패드", "beauty", 22000, 29000, 4.6, 207, "2026-07-08T15:00:00.000Z"],
  ["p29", "스테이홈", "모듈 수납 바스켓", "home", 27000, null, 4.3, 119, "2026-07-07T15:00:00.000Z"],
  ["p30", "플로우", "무선 마우스", "digital", 59000, 69000, 4.5, 463, "2026-07-05T15:00:00.000Z"],
];

const sizeOptions = [
  { value: 24, stock: 3 },
  { value: 25, stock: 0 },
  { value: 26, stock: 12 },
  { value: 27, stock: 5 },
  { value: 28, stock: 0 },
];

export const products: Product[] = seeds.map(
  ([id, brand, name, category, price, originalPrice, rating, reviewCount, createdAt]) => {
    const product: Product = {
      id,
      brand,
      name,
      category,
      price,
      originalPrice,
      image: `/images/products/${category}.svg`,
      freeShipping: price >= 50000,
      sizes: category === "fashion" ? sizeOptions : [],
      rating,
      reviewCount,
      createdAt,
    };

    if (id === "p1") {
      return { ...product, image: "/next.svg", freeShipping: true, sizes: sizeOptions };
    }

    if (id === "p2") {
      return { ...product, image: "/next.svg", freeShipping: false, sizes: [] };
    }

    return product;
  },
);

const mockDelayMs = process.env.NODE_ENV === "test" ? 0 : 500;

export const waitForMockApi = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, mockDelayMs);
  });
```

- [ ] **Step 3: Add five local SVG category images**

Each file uses the same minimal vector structure with its category label. For example, create `public/images/products/food.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-labelledby="title">
  <title id="title">Food product placeholder</title>
  <rect width="600" height="600" fill="#f2e8dc"/>
  <circle cx="300" cy="270" r="120" fill="#c48b52"/>
  <circle cx="300" cy="270" r="48" fill="#f2e8dc"/>
  <text x="300" y="470" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" fill="#4a3424">FOOD</text>
</svg>
```

Create `public/images/products/fashion.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-labelledby="title"><title id="title">Fashion product placeholder</title><rect width="600" height="600" fill="#e8e5e1"/><path d="M210 175h180l55 105-70 35-20-45v170H245V270l-20 45-70-35 55-105Z" fill="#7f786f"/><text x="300" y="510" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" fill="#3f3a35">FASHION</text></svg>
```

Create `public/images/products/beauty.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-labelledby="title"><title id="title">Beauty product placeholder</title><rect width="600" height="600" fill="#f3e4e7"/><rect x="235" y="170" width="130" height="250" rx="35" fill="#b86f7f"/><rect x="265" y="115" width="70" height="75" rx="15" fill="#7f4855"/><text x="300" y="510" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" fill="#56313a">BEAUTY</text></svg>
```

Create `public/images/products/home.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-labelledby="title"><title id="title">Home product placeholder</title><rect width="600" height="600" fill="#e7ece7"/><path d="M145 300 300 165l155 135v145H340v-95h-80v95H145V300Z" fill="#718274"/><text x="300" y="525" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" fill="#354238">HOME</text></svg>
```

Create `public/images/products/digital.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-labelledby="title"><title id="title">Digital product placeholder</title><rect width="600" height="600" fill="#e2e8ee"/><rect x="135" y="150" width="330" height="230" rx="25" fill="#66788a"/><rect x="275" y="380" width="50" height="55" fill="#66788a"/><rect x="220" y="430" width="160" height="22" rx="11" fill="#66788a"/><text x="300" y="520" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" fill="#334352">DIGITAL</text></svg>
```

Do not add raster downloads or remote image hosts.

- [ ] **Step 4: Type-check the contracts and fixtures**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected: both commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/types/commerce.ts src/app/api/_data/commerce.ts public/images/products
git commit -m "feat: 5주차 커머스 목 데이터 추가"
```

---

### Task 3: Expand `GET /api/products` with filtering, sorting, pagination, and scenarios

**Files:**
- Create: `src/app/api/products/route.test.ts`
- Modify: `src/app/api/products/route.ts`

**Interfaces:**
- Consumes: `categories`, `products`, `waitForMockApi`, `ProductSort`, `ProductListResponse`, `ApiErrorResponse`.
- Produces: `GET(request: NextRequest): Promise<NextResponse<ProductListResponse | ApiErrorResponse>>`.

- [ ] **Step 1: Write failing Route Handler tests**

Create `src/app/api/products/route.test.ts`:

```ts
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET } from "./route";

const request = (query = "") =>
  GET(new NextRequest(`http://localhost/api/products${query}`));

describe("GET /api/products", () => {
  it("preserves Week 04 defaults and adds paging metadata", async () => {
    const response = await request();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.products).toHaveLength(12);
    expect(body.categories).toHaveLength(5);
    expect(body.totalCount).toBe(30);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(12);
    expect(body.products[0]).toMatchObject({
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
    });
    expect(body.products[1]).toMatchObject({
      id: "p2",
      name: "에브리씽 베이글",
      price: 3800,
      originalPrice: null,
      image: "/next.svg",
      freeShipping: false,
      sizes: [],
    });

    const allCategoryBody = await (await request("?category=all&pageSize=24")).json();
    expect(allCategoryBody.totalCount).toBe(30);
  });

  it("searches brand and name without case sensitivity", async () => {
    const response = await request("?q=%EB%A3%A8%ED%94%84&pageSize=24");
    const body = await response.json();
    expect(body.products.map((product: { id: string }) => product.id)).toEqual(["p1", "p2", "p26"]);

    const caseResponse = await request("?q=%20%204k%20%20&pageSize=24");
    const caseBody = await caseResponse.json();
    expect(caseBody.products.map((product: { id: string }) => product.id)).toEqual(["p24"]);
  });

  it("filters category and sorts popularity deterministically", async () => {
    const response = await request("?category=digital&sort=popular&pageSize=24");
    const body = await response.json();
    expect(body.products.map((product: { id: string }) => product.id)).toEqual([
      "p21",
      "p22",
      "p30",
      "p23",
      "p25",
      "p24",
    ]);
  });

  it("sorts latest and price order explicitly", async () => {
    const latestBody = await (await request("?sort=latest&pageSize=24")).json();
    expect(latestBody.products[0].id).toBe("p26");

    const lowPriceBody = await (await request("?sort=price-asc&pageSize=24")).json();
    expect(lowPriceBody.products[0].id).toBe("p1");

    const highPriceBody = await (await request("?sort=price-desc&pageSize=24")).json();
    expect(highPriceBody.products[0].id).toBe("p24");
  });

  it("returns an empty page when page exceeds the filtered result", async () => {
    const response = await request("?category=food&page=9&pageSize=12");
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.products).toEqual([]);
    expect(body.totalCount).toBe(6);
  });

  it.each([
    "?category=unknown",
    "?sort=random",
    "?page=0",
    "?page=-1",
    "?page=1.5",
    "?pageSize=0",
    "?pageSize=25",
    "?pageSize=1.5",
  ])("rejects invalid query %s", async (query) => {
    const response = await request(query);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "요청 조건을 확인해주세요." });
  });

  it("supports deterministic empty and error scenarios", async () => {
    const emptyResponse = await request("?scenario=empty");
    const emptyBody = await emptyResponse.json();
    expect(emptyBody.products).toEqual([]);
    expect(emptyBody.categories).toHaveLength(5);

    const errorResponse = await request("?scenario=error");
    expect(errorResponse.status).toBe(500);
    expect(await errorResponse.json()).toEqual({ message: "상품 목록을 불러오지 못했습니다." });
  });
});
```

- [ ] **Step 2: Run the test and confirm the old handler fails**

Run:

```bash
pnpm exec vitest run src/app/api/products/route.test.ts
```

Expected: FAIL because the old handler returns only the two Week 04 products and does not provide categories or paging metadata.

- [ ] **Step 3: Implement the minimal Week 04-style handler**

Replace `src/app/api/products/route.ts` with:

```ts
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
```

- [ ] **Step 4: Run focused and static checks**

Run:

```bash
pnpm exec vitest run src/app/api/products/route.test.ts
pnpm exec tsc --noEmit
pnpm lint
```

Expected: all commands exit 0; all product route contract tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/products/route.ts src/app/api/products/route.test.ts
git commit -m "feat: 상품 목록 목 API 확장"
```

---

### Task 4: Add the aggregate home endpoint

**Files:**
- Create: `src/app/api/home/route.test.ts`
- Create: `src/app/api/home/route.ts`

**Interfaces:**
- Consumes: `categories`, `homeBanner`, `products`, `waitForMockApi`.
- Produces: `GET(request: NextRequest): Promise<NextResponse<HomeResponse | ApiErrorResponse>>`.

- [ ] **Step 1: Create a compiling stub handler**

Create `src/app/api/home/route.ts`:

```ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "구현 전입니다." }, { status: 501 });
}
```

- [ ] **Step 2: Write failing home endpoint tests**

Create `src/app/api/home/route.test.ts`:

```ts
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET } from "./route";

const request = (query = "") =>
  GET(new NextRequest(`http://localhost/api/home${query}`));

describe("GET /api/home", () => {
  it("returns banner, categories, popular products, and new products", async () => {
    const response = await request();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.banner.title).toBe("매일 새롭게 발견하는 취향");
    expect(body.categories).toHaveLength(5);
    expect(body.popularProducts).toHaveLength(6);
    expect(body.newProducts).toHaveLength(6);
    expect(body.popularProducts[0].id).toBe("p21");
    expect(body.newProducts[0].id).toBe("p26");
  });

  it("keeps banner and categories in the empty scenario", async () => {
    const response = await request("?scenario=empty");
    const body = await response.json();
    expect(body.banner).toBeDefined();
    expect(body.categories).toHaveLength(5);
    expect(body.popularProducts).toEqual([]);
    expect(body.newProducts).toEqual([]);
  });

  it("returns a deterministic error scenario", async () => {
    const response = await request("?scenario=error");
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: "홈 데이터를 불러오지 못했습니다." });
  });
});
```

- [ ] **Step 3: Run the test and verify it fails**

Run:

```bash
pnpm exec vitest run src/app/api/home/route.test.ts
```

Expected: FAIL because the stub returns HTTP 501 and does not satisfy the home response contract.

- [ ] **Step 4: Implement the home handler**

Replace `src/app/api/home/route.ts` with:

```ts
import { NextRequest, NextResponse } from "next/server";
import { categories, homeBanner, products, waitForMockApi } from "@/app/api/_data/commerce";
import type { ApiErrorResponse, HomeResponse } from "@/types/commerce";

export async function GET(
  request: NextRequest,
): Promise<NextResponse<HomeResponse | ApiErrorResponse>> {
  await waitForMockApi();

  const scenario = request.nextUrl.searchParams.get("scenario");

  if (scenario === "error") {
    return NextResponse.json(
      { message: "홈 데이터를 불러오지 못했습니다." },
      { status: 500 },
    );
  }

  const popularProducts = [...products]
    .sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating)
    .slice(0, 6);
  const newProducts = [...products]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 6);

  return NextResponse.json({
    banner: homeBanner,
    categories,
    popularProducts: scenario === "empty" ? [] : popularProducts,
    newProducts: scenario === "empty" ? [] : newProducts,
  });
}
```

- [ ] **Step 5: Run focused and full API tests**

Run:

```bash
pnpm exec vitest run src/app/api/home/route.test.ts
pnpm test
pnpm exec tsc --noEmit
pnpm lint
```

Expected: all commands exit 0; all home and product route contract tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/home/route.ts src/app/api/home/route.test.ts
git commit -m "feat: 홈 화면 목 API 추가"
```

---

### Task 5: Add opt-in static layout examples without touching student pages

**Files:**
- Create: `src/examples/week-05-layout/HomeLayoutExample.tsx`
- Create: `src/examples/week-05-layout/ProductListLayoutExample.tsx`
- Create: `src/examples/week-05-layout/week-05-layout.css`
- Create: `src/examples/week-05-layout/README.md`

**Interfaces:**
- Produces: non-routed static JSX that students may copy, edit, or ignore.
- Does not consume APIs, Query, nuqs, or Zustand.

- [ ] **Step 1: Create the home static layout**

Create `src/examples/week-05-layout/HomeLayoutExample.tsx`:

```tsx
import Link from "next/link";
import "./week-05-layout.css";

/**
 * 5주차 과제를 빠르게 시작할 수 있도록 제공하는 최소 레이아웃 예시입니다.
 * 이 구조는 상태관리 아키텍처의 정답이 아닙니다.
 * 그대로 사용하거나, 기존 컴포넌트를 재사용하거나, 자유롭게 교체해도 됩니다.
 * 데이터 조회, Query 구성, 전역 상태와 이벤트 연결은 포함되어 있지 않습니다.
 */
export function HomeLayoutExample() {
  return (
    <main className="week05-page">
      <header className="week05-header">
        <Link href="/">Commerce</Link>
        <nav aria-label="주요 메뉴">
          <Link href="/products">상품</Link>
          <span>위시리스트 0</span>
          <span>장바구니 0</span>
        </nav>
      </header>
      <section className="week05-hero">
        <p>배너 설명</p>
        <h1>홈 배너 제목</h1>
      </section>
      <section className="week05-section">
        <h2>카테고리</h2>
        <div className="week05-categories">
          {["푸드", "패션", "뷰티", "홈", "디지털"].map((category) => (
            <Link key={category} href="/products">{category}</Link>
          ))}
        </div>
      </section>
      {["인기 상품", "신상품"].map((title) => (
        <section className="week05-section" key={title}>
          <h2>{title}</h2>
          <div className="week05-grid">
            {Array.from({ length: 4 }, (_, index) => (
              <article className="week05-product" key={`${title}-${index}`}>
                <div className="week05-image" aria-hidden="true" />
                <p>브랜드</p>
                <h3>상품명</h3>
                <strong>0원</strong>
                <div><button type="button">찜</button><button type="button">담기</button></div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
```

- [ ] **Step 2: Create the product-list static layout**

Create `src/examples/week-05-layout/ProductListLayoutExample.tsx`:

```tsx
import Link from "next/link";
import "./week-05-layout.css";

/**
 * 5주차 과제를 빠르게 시작할 수 있도록 제공하는 최소 레이아웃 예시입니다.
 * 이 구조는 상태관리 아키텍처의 정답이 아닙니다.
 * 그대로 사용하거나, 기존 컴포넌트를 재사용하거나, 자유롭게 교체해도 됩니다.
 * 데이터 조회, Query 구성, 전역 상태와 이벤트 연결은 포함되어 있지 않습니다.
 */
export function ProductListLayoutExample() {
  return (
    <main className="week05-page">
      <header className="week05-header">
        <Link href="/">Commerce</Link>
        <nav aria-label="주요 메뉴">
          <Link href="/products">상품</Link>
          <span>위시리스트 0</span>
          <span>장바구니 0</span>
        </nav>
      </header>
      <section className="week05-section">
        <h1>상품 목록</h1>
        <form className="week05-filters">
          <label>검색<input name="q" placeholder="상품명 또는 브랜드" /></label>
          <label>카테고리<select name="category" defaultValue=""><option value="">전체</option></select></label>
          <label>정렬<select name="sort" defaultValue="latest"><option value="latest">최신순</option></select></label>
        </form>
      </section>
      <section className="week05-section" aria-label="상품 검색 결과">
        <p>총 0개</p>
        <div className="week05-grid">
          {Array.from({ length: 8 }, (_, index) => (
            <article className="week05-product" key={index}>
              <div className="week05-image" aria-hidden="true" />
              <p>브랜드</p>
              <h2>상품명</h2>
              <strong>0원</strong>
              <div><button type="button">찜</button><button type="button">담기</button></div>
            </article>
          ))}
        </div>
        <nav className="week05-pagination" aria-label="페이지 이동">
          <button type="button">이전</button><span>1 / 1</span><button type="button">다음</button>
        </nav>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Add minimal CSS**

Create `src/examples/week-05-layout/week-05-layout.css`:

```css
.week05-page {
  width: min(100% - 32px, 1200px);
  margin: 0 auto;
  padding: 24px 0 64px;
}

.week05-header,
.week05-header nav,
.week05-categories,
.week05-filters,
.week05-pagination,
.week05-product > div:last-child {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.week05-header {
  justify-content: space-between;
  padding-bottom: 24px;
}

.week05-hero {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 8px;
  padding: 32px;
  background: #ececec;
}

.week05-section {
  margin-top: 40px;
}

.week05-section > h1,
.week05-section > h2 {
  margin-bottom: 16px;
}

.week05-categories a,
.week05-product button,
.week05-pagination button {
  padding: 8px 12px;
  border: 1px solid #c8c8c8;
  background: transparent;
}

.week05-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 20px;
}

.week05-product {
  display: grid;
  gap: 8px;
}

.week05-image {
  aspect-ratio: 1;
  background: #ececec;
}

.week05-filters label {
  display: grid;
  gap: 6px;
}

.week05-filters input,
.week05-filters select {
  min-height: 40px;
  padding: 8px 10px;
  border: 1px solid #c8c8c8;
  background: transparent;
  color: inherit;
}

.week05-pagination {
  justify-content: center;
  margin-top: 32px;
}

@media (max-width: 720px) {
  .week05-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

Do not add state-dependent selectors such as `.selected`, `.loading`, `.error`, `.in-cart`, or `.wishlisted`.

- [ ] **Step 4: Document opt-in use**

Create `src/examples/week-05-layout/README.md`:

```md
# 5주차 최소 레이아웃 예시

이 폴더는 UI 구현 시간을 줄이기 위한 정적 JSX와 CSS 예시입니다.

- 기존 `src/app/**`를 자동으로 교체하지 않습니다.
- 필요한 부분만 옮겨 쓰거나, 4주차까지 만든 레이아웃을 그대로 사용해도 됩니다.
- 파일 구조와 컴포넌트 경계는 평가 대상이나 권장 정답이 아닙니다.
- API, TanStack Query, nuqs, Zustand, 이벤트와 상태별 화면은 연결되어 있지 않습니다.
```

- [ ] **Step 5: Verify examples compile but are not routed**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

Expected: all commands exit 0; build routes remain `/`, `/api/home`, and `/api/products`; there is no `/examples` route.

- [ ] **Step 6: Commit**

```bash
git add src/examples/week-05-layout
git commit -m "feat: 5주차 최소 레이아웃 예시 추가"
```

---

### Task 6: Publish the Week 05 assignment guide and root navigation

**Files:**
- Create: `docs/assignments/week-05.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: the exact API and scope implemented in Tasks 1–5.
- Produces: the student-facing Korean assignment and discoverable root links.

- [ ] **Step 1: Write the student-facing assignment**

Create `docs/assignments/week-05.md` with these exact sections and requirements:

```md
# 5주차 — 상태관리 아키텍처: 원본이 있는 곳에 상태를 둔다

> 홈과 상품 목록을 만들며 서버·URL·클라이언트 상태의 경계를 직접 정합니다.

## 왜 이 과제를 하는가

- 서버에서 온 데이터는 내가 소유하는 값이 아니라 원본의 스냅샷입니다.
- 공유·새로고침·뒤로 가기가 필요한 검색 조건의 원본은 URL입니다.
- 서버와 URL에 맡기고 남은 상태만 전역 클라이언트 상태가 됩니다.
- 도구를 먼저 고르지 않고 Source of Truth를 먼저 찾는 것이 이번 주의 기준입니다.

## 제공되는 것

- `GET /api/home`
- `GET /api/products`
- `@tanstack/react-query`, `nuqs`, `zustand`
- 상품 mock 데이터와 로컬 이미지
- `src/examples/week-05-layout/`의 선택 가능한 정적 레이아웃 예시

제공된 레이아웃은 UI 구현 시간을 줄이기 위한 예시입니다. 기존 레이아웃을 유지하거나 4주차까지 만든 컴포넌트를 재사용해도 됩니다. 제공된 파일 구조와 컴포넌트 경계는 평가 대상이나 권장 정답이 아닙니다.

## 기본 과제

1. `상태 · 소유자 · 수명 · 공유 범위 · 선택 이유` 표를 먼저 작성합니다.
2. TanStack Query v5의 `queryOptions`로 홈·목록 쿼리 팩토리를 만듭니다.
3. query key, queryFn, staleTime을 함께 두고 캐시 정책의 근거를 기록합니다.
4. nuqs의 `NuqsAdapter`, `useQueryStates`, parser로 검색·카테고리·정렬·페이지를 URL 상태로 관리합니다.
5. 홈에서 배너·카테고리·인기 상품·신상품을 표시합니다.
6. 목록에서 검색·카테고리·정렬·페이지네이션을 제공합니다.
7. Zustand로 비로그인 장바구니·위시리스트의 담기/빼기와 헤더 개수를 관리합니다.
8. Header는 개수만, 상품 버튼은 해당 상품 상태와 필요한 action만 selector로 구독합니다.
9. 홈과 목록의 로딩·에러·빈 상태를 구분합니다.
10. URL 공유·새로고침·앞뒤 이동과 클라이언트 페이지 이동 중 store 일관성을 검증합니다.

기본 과제에서는 새로고침 후 장바구니와 위시리스트가 초기화되어도 됩니다. 장바구니 수량·금액·별도 페이지도 범위에서 제외합니다.

## Advanced — 선택

### A. 상태 영속화

- Zustand `persist`로 장바구니와 위시리스트를 복원합니다.
- Next.js hydration 불일치 없이 처리합니다.
- 잘못되거나 오래된 저장값의 복구 전략을 둡니다.
- 저장 데이터의 `version`과 `migrate`를 적용합니다.

### B. App Router 서버 프리패치

- 요청마다 분리된 QueryClient를 생성합니다.
- 클라이언트 조회와 동일한 queryOptions 쿼리 팩토리를 Server Component의 `prefetchQuery`에 재사용합니다.
- `dehydrate`와 `HydrationBoundary`로 캐시를 전달합니다.
- 클라이언트에서 초기 요청이 중복되지 않는지 확인합니다.
- 모든 데이터를 무조건 prefetch하지 않고 적용 대상을 선택한 근거를 기록합니다.

### C. 사용자 경험 개선

- 검색어 debounce
- 다음 페이지 prefetch
- 상품 목록으로 이동하기 전 prefetch
- 페이지 변경 중 기존 목록 유지
- 전체 페이지 새로고침 없는 오류 재시도 경험

### D. 테스트

- Zustand action과 selector
- Header 개수 파생
- nuqs URL 조건과 query key 일치
- 홈과 목록의 store 상태 동기화

## API 계약

### `GET /api/home`

- 기본: banner, categories, popularProducts, newProducts
- `scenario=empty`: 상품 배열만 비움
- `scenario=error`: `{ "message": "홈 데이터를 불러오지 못했습니다." }`, HTTP 500

### `GET /api/products`

`q`, `category`, `sort`, `page`, `pageSize`, 검증용 `scenario`를 지원합니다.

- q: 앞뒤 공백 제거, 상품명·브랜드의 대소문자 구분 없는 부분 검색
- category: `all | food | fashion | beauty | home | digital`
- sort: `latest | popular | price-asc | price-desc`
- sort 생략: 4주차 fixture 순서를 유지
- 화면의 nuqs 기본값은 `latest`로 두고 API 요청에 `sort=latest`를 명시합니다. sort 생략 동작은 4주차 호환용입니다.
- page: 1부터 시작
- pageSize: 1~24, 기본 12
- page가 마지막 페이지를 초과하면 빈 products와 실제 totalCount를 반환
- 잘못된 category·sort·page·pageSize: `{ "message": "요청 조건을 확인해주세요." }`, HTTP 400
- 응답: products, categories, totalCount, page, pageSize
- `scenario=empty`: products만 비움
- `scenario=error`: `{ "message": "상품 목록을 불러오지 못했습니다." }`, HTTP 500
- TypeScript 계약: `src/types/commerce.ts`

## 새 주차 코드 동기화

- `package.json` 충돌 시 기존 설정을 보존하면서 `@tanstack/react-query`, `nuqs`, `zustand` 의존성을 유지한 뒤 `pnpm install`로 lockfile을 다시 생성합니다.
- `src/app/api/products/route.ts` 충돌 시 5주차 API 계약과 p1/p2의 기존 필드를 유지하고, 본인이 추가한 UI 코드는 덮어쓰지 않습니다.
- `src/examples/week-05-layout/`은 자동 적용되지 않습니다. 필요한 부분만 옮겨 쓰거나 기존 레이아웃을 유지합니다.

## 기록할 설계 근거

- TanStack Query·nuqs·Zustand의 책임을 나눈 기준
- staleTime과 gcTime 정책
- store 데이터 형태와 selector 경계
- 전역으로 올리지 않은 상태와 이유
- 로그인·서버 동기화가 생기면 위시리스트 소유권이 어떻게 달라지는지
- 새로고침·URL 공유·앞뒤 이동·페이지 이동 검증 결과

## 완료 기준

- 서버 상태는 queryOptions 쿼리 팩토리와 TanStack Query로 관리됩니다.
- URL 상태는 타입 안전한 nuqs parser로 관리됩니다.
- 로컬 장바구니·위시리스트는 Zustand와 선택적 구독으로 관리됩니다.
- 홈과 목록의 같은 상품 상태와 Header 개수가 일치합니다.
- 로딩·에러·빈 상태가 구분됩니다.
- 타입·lint·build가 통과합니다.
- AI 생성 부분을 표시하고 직접 검토했습니다.
```

- [ ] **Step 2: Add one minimal root README link**

Under `## 주차별 과제`, add this single line without replacing the existing structure or surrounding guidance:

```md
- [5주차 — 상태관리 아키텍처](docs/assignments/week-05.md)
```

- [ ] **Step 3: Verify documentation matches implementation**

Run:

```bash
rg -n "api/home|api/products|queryOptions|nuqs|Zustand|Advanced" docs/assignments/week-05.md README.md
pnpm lint
pnpm test
pnpm build
```

Expected: all required terms are found; lint, all API contract tests, and build pass.

- [ ] **Step 4: Commit**

```bash
git add docs/assignments/week-05.md README.md
git commit -m "docs: 5주차 상태관리 과제 추가"
```

---

### Task 7: Final verification and handoff

**Files:**
- Verify all files changed in Tasks 1–6.

**Interfaces:**
- Produces: a clean implementation branch ready for review or PR creation.

- [ ] **Step 1: Run the complete verification suite**

```bash
pnpm test
pnpm lint
pnpm exec tsc --noEmit
pnpm build
git diff --check origin/main...HEAD
```

Expected: all API contract tests pass; lint, typecheck, build, and diff check exit 0.

- [ ] **Step 2: Inspect the final diff for forbidden solution code**

Run:

```bash
rg -n "QueryClientProvider|NuqsAdapter|useQueryStates|create\(" src --glob '!src/examples/**' --glob '!src/types/**'
git diff --stat origin/main...HEAD
git status --short --branch
```

Expected: no application Query/nuqs/Zustand implementation is present outside docs/examples/types; status is clean.

- [ ] **Step 3: Manually verify deterministic endpoints**

Run `pnpm dev`, then in a second shell:

```bash
curl -s "http://localhost:3000/api/home"
curl -s "http://localhost:3000/api/products?category=digital&sort=popular&page=1&pageSize=12"
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/api/products?sort=random"
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/api/home?scenario=error"
curl -s -o /dev/null -w "%{time_total}\n" "http://localhost:3000/api/products"
```

Expected: first two commands return valid JSON; invalid sort prints `400`; home error prints `500`; development endpoint time is at least `0.5` seconds.

- [ ] **Step 4: Review commit boundaries**

Run:

```bash
git log --oneline origin/main..HEAD
```

Expected: design commits plus focused dependency, fixture, products API, home API, layout example, and assignment documentation commits.
