import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import { createMockApiServer } from "./server.mjs";

let server;
let baseUrl;

before(async () => {
  server = createMockApiServer();
  await server.listen(0);
  baseUrl = server.url;
});

beforeEach(async () => {
  await fetch(`${baseUrl}/__test__/reset`, { method: "POST" });
});

after(async () => {
  await server.close();
});

describe("E2E mock API server", () => {
  it("health endpoint는 mock API 서버 준비 상태를 ok로 응답한다", async () => {
    const response = await fetch(`${baseUrl}/__test__/health`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
  });

  it("products endpoint는 기본 상태에서 페이지네이션된 상품 목록을 응답한다", async () => {
    const response = await fetch(`${baseUrl}/api/products?page=1&pageSize=2`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.page, 1);
    assert.equal(body.pageSize, 2);
    assert.equal(body.products.length, 2);
    assert.equal(typeof body.totalCount, "number");
    assert.ok(body.categories.length > 0);
  });

  it("products scenario를 error로 바꾼 뒤 reset하면 success 응답으로 복구된다", async () => {
    await fetch(`${baseUrl}/__test__/scenario`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ products: "error" }),
    });

    const errorResponse = await fetch(`${baseUrl}/api/products`);
    assert.equal(errorResponse.status, 500);
    assert.deepEqual(await errorResponse.json(), {
      message: "상품 목록을 불러오지 못했습니다.",
    });

    await fetch(`${baseUrl}/__test__/reset`, { method: "POST" });

    const successResponse = await fetch(`${baseUrl}/api/products`);
    assert.equal(successResponse.status, 200);
  });

  it("empty products scenario는 카테고리를 유지하고 0개 상품을 응답한다", async () => {
    await fetch(`${baseUrl}/__test__/scenario`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ products: "empty" }),
    });

    const response = await fetch(`${baseUrl}/api/products?q=없는상품`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body.products, []);
    assert.equal(body.totalCount, 0);
    assert.ok(body.categories.length > 0);
  });

  it("브라우저 fetch를 위한 CORS preflight 요청에 응답한다", async () => {
    const response = await fetch(`${baseUrl}/api/products`, {
      method: "OPTIONS",
      headers: {
        origin: "http://127.0.0.1:3000",
        "access-control-request-method": "GET",
      },
    });

    assert.equal(response.status, 204);
    assert.equal(response.headers.get("access-control-allow-origin"), "http://127.0.0.1:3000");
    assert.match(response.headers.get("access-control-allow-methods") ?? "", /GET/);
  });
});
