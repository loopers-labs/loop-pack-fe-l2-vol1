// src/test/msw/handlers.ts
import { http, HttpResponse } from "msw";
import type { OrderCreateRequest } from "@/types/auth";
import { buildAuthUser, buildHomeResponse, buildOrder, buildProductListResponse } from "./fixtures";

// 기본 핸들러는 성공 경로만 둔다. 401·500·지연은 각 테스트가 server.use 로 덧씌운다
export const handlers = [
  http.get("/api/products", ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(
      buildProductListResponse({
        q: url.searchParams.get("q") ?? "",
        category: url.searchParams.get("category") ?? "all",
        sort: url.searchParams.get("sort") ?? "latest",
        page: Number(url.searchParams.get("page") ?? 1),
        pageSize: Number(url.searchParams.get("pageSize") ?? 12),
      }),
    );
  }),
  http.get("/api/home", () => HttpResponse.json(buildHomeResponse())),
  http.get("/api/auth/me", () => HttpResponse.json({ user: buildAuthUser() })),
  http.post("/api/auth/login", () => HttpResponse.json({ user: buildAuthUser() })),
  http.post("/api/auth/logout", () => new HttpResponse(null, { status: 204 })),
  http.get("/api/orders", () => HttpResponse.json({ orders: [] })),
  http.post("/api/orders", async ({ request }) => {
    const body = (await request.json()) as OrderCreateRequest;
    return HttpResponse.json({ order: buildOrder({ items: body.items }) }, { status: 201 });
  }),
];
