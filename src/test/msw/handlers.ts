// src/test/msw/handlers.ts
import { http, HttpResponse } from "msw";
import { buildHomeResponse, buildProductListResponse } from "./fixtures";

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
];
