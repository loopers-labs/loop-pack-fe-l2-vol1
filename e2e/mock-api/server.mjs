import { createServer } from "node:http";
import { pathToFileURL } from "node:url";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 4010;
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };
const scenarioValues = new Set(["success", "empty", "error", "slow"]);

const categories = [
  { id: "casual", name: "캐주얼" },
  { id: "fashion", name: "패션" },
  { id: "goods", name: "뷰티·잡화" },
  { id: "home", name: "홈" },
  { id: "digital", name: "디지털" },
];

const products = [
  createProduct({
    id: "p1",
    name: "E2E Mock Backpack",
    category: "casual",
    price: 79000,
    reviewCount: 312,
    rating: 4.8,
    createdAt: "2026-07-09T09:00:00.000Z",
  }),
  createProduct({
    id: "p6",
    name: "WOMAN GNRL 케이블 풀오버",
    category: "fashion",
    price: 69000,
    reviewCount: 520,
    rating: 4.7,
    createdAt: "2026-07-10T09:00:00.000Z",
  }),
  createProduct({
    id: "p11",
    brand: "인스테드",
    name: "하이드레이팅 나이트 립 마스크",
    category: "goods",
    price: 48000,
    originalPrice: 58000,
    reviewCount: 990,
    rating: 4.9,
    createdAt: "2026-07-07T09:00:00.000Z",
  }),
  createProduct({
    id: "p16",
    brand: "스탠리",
    name: "스탠리 클래식 런치박스",
    category: "home",
    price: 75000,
    originalPrice: 89000,
    reviewCount: 418,
    rating: 4.8,
    createdAt: "2026-07-04T09:00:00.000Z",
  }),
  createProduct({
    id: "p21",
    brand: "메이커스",
    name: "메이커스 투명케이스",
    category: "digital",
    price: 22000,
    reviewCount: 122,
    rating: 4.4,
    createdAt: "2026-06-30T09:00:00.000Z",
  }),
];

function createProduct(product) {
  return {
    brand: "Loopers Select",
    originalPrice: null,
    image: `/images/products/${product.id}.jpg`,
    freeShipping: false,
    sizes: [],
    ...product,
  };
}

function createInitialState() {
  return {
    home: "success",
    products: "success",
  };
}

function createCorsHeaders(request) {
  return {
    "access-control-allow-origin": request.headers.origin ?? "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "Content-Type",
  };
}

function sendJson(response, status, body, headers = {}) {
  response.writeHead(status, { ...JSON_HEADERS, ...headers });
  response.end(JSON.stringify(body));
}

function sendEmpty(response, status, headers = {}) {
  response.writeHead(status, headers);
  response.end();
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
    });

    request.on("end", () => {
      if (body.trim() === "") {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });

    request.on("error", reject);
  });
}

function normalizePositiveInteger(value, fallback) {
  if (value === null || !/^[1-9]\d*$/.test(value)) {
    return fallback;
  }

  const numberValue = Number(value);
  return Number.isSafeInteger(numberValue) ? numberValue : fallback;
}

function createProductsResponse(url, scenario) {
  if (scenario === "empty") {
    return {
      products: [],
      categories,
      totalCount: 0,
      page: normalizePositiveInteger(url.searchParams.get("page"), 1),
      pageSize: normalizePositiveInteger(url.searchParams.get("pageSize"), 12),
    };
  }

  const q = url.searchParams.get("q")?.trim().toLocaleLowerCase("ko") ?? "";
  const category = url.searchParams.get("category");
  const sort = url.searchParams.get("sort");
  const page = normalizePositiveInteger(url.searchParams.get("page"), 1);
  const pageSize = normalizePositiveInteger(url.searchParams.get("pageSize"), 12);

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      category === null || category === "all" || product.category === category;
    const searchable = `${product.brand} ${product.name}`.toLocaleLowerCase("ko");
    return matchesCategory && searchable.includes(q);
  });
  const sortedProducts = [...filteredProducts];

  if (sort === "popular") {
    sortedProducts.sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating);
  }

  if (sort === "price-asc") {
    sortedProducts.sort((a, b) => a.price - b.price);
  }

  if (sort === "price-desc") {
    sortedProducts.sort((a, b) => b.price - a.price);
  }

  if (sort === "latest") {
    sortedProducts.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  const start = (page - 1) * pageSize;

  return {
    products: sortedProducts.slice(start, start + pageSize),
    categories,
    totalCount: filteredProducts.length,
    page,
    pageSize,
  };
}

function createHomeResponse() {
  return {
    banner: {
      title: "매일 새롭게 발견하는 취향",
      description: "지금 가장 사랑받는 상품을 만나보세요.",
      image: "/images/products/p6.jpg",
    },
    categories,
    popularProducts: products.slice(0, 3),
    newProducts: [...products]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 3),
  };
}

export function createMockApiServer() {
  const state = createInitialState();
  let serverUrl = null;

  const httpServer = createServer(async (request, response) => {
    const corsHeaders = createCorsHeaders(request);
    const url = new URL(request.url ?? "/", "http://127.0.0.1");

    if (request.method === "OPTIONS") {
      sendEmpty(response, 204, corsHeaders);
      return;
    }

    if (request.method === "GET" && url.pathname === "/__test__/health") {
      sendJson(response, 200, { ok: true }, corsHeaders);
      return;
    }

    if (request.method === "POST" && url.pathname === "/__test__/reset") {
      Object.assign(state, createInitialState());
      sendEmpty(response, 204, corsHeaders);
      return;
    }

    if (request.method === "POST" && url.pathname === "/__test__/scenario") {
      try {
        const body = await readJsonBody(request);

        for (const endpoint of ["home", "products"]) {
          if (body[endpoint] === undefined) {
            continue;
          }

          if (!scenarioValues.has(body[endpoint])) {
            sendJson(response, 400, { message: "지원하지 않는 scenario입니다." }, corsHeaders);
            return;
          }

          state[endpoint] = body[endpoint];
        }

        sendEmpty(response, 204, corsHeaders);
      } catch {
        sendJson(response, 400, { message: "요청 본문을 확인해주세요." }, corsHeaders);
      }

      return;
    }

    if (request.method === "GET" && url.pathname === "/api/home") {
      if (state.home === "slow") {
        await wait(1_500);
      }

      if (state.home === "error") {
        sendJson(response, 500, { message: "홈 정보를 불러오지 못했습니다." }, corsHeaders);
        return;
      }

      sendJson(response, 200, createHomeResponse(), corsHeaders);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/products") {
      if (state.products === "slow") {
        await wait(1_500);
      }

      if (state.products === "error") {
        sendJson(response, 500, { message: "상품 목록을 불러오지 못했습니다." }, corsHeaders);
        return;
      }

      sendJson(response, 200, createProductsResponse(url, state.products), corsHeaders);
      return;
    }

    sendJson(response, 404, { message: "요청 경로를 찾을 수 없습니다." }, corsHeaders);
  });

  return {
    get url() {
      if (serverUrl === null) {
        throw new Error("Mock API server is not listening.");
      }

      return serverUrl;
    },
    listen(port = DEFAULT_PORT, host = DEFAULT_HOST) {
      return new Promise((resolve, reject) => {
        httpServer.once("error", reject);
        httpServer.listen(port, host, () => {
          httpServer.off("error", reject);
          const address = httpServer.address();

          if (address === null || typeof address === "string") {
            reject(new Error("Mock API server address is not available."));
            return;
          }

          serverUrl = `http://${address.address}:${address.port}`;
          resolve();
        });
      });
    },
    close() {
      return new Promise((resolve, reject) => {
        httpServer.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          serverUrl = null;
          resolve();
        });
      });
    },
  };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const server = createMockApiServer();
  await server.listen(Number(process.env.MOCK_API_PORT ?? DEFAULT_PORT));

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, async () => {
      await server.close();
      process.exit(0);
    });
  }
}
