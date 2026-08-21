import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";
import { buildProductListResponse } from "@/test/msw/fixtures";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render-with-providers";
import { ProductListContent } from "./product-list-content";

it("진입 직후에는 로딩 표시가 보이고 응답이 오면 상품 목록으로 바뀐다", async () => {
  renderWithProviders(<ProductListContent />);
  expect(screen.getByRole("region", { name: "상품 목록 불러오는 중" })).toBeInTheDocument();

  await screen.findByText("총 25개");
  expect(screen.queryByRole("region", { name: "상품 목록 불러오는 중" })).not.toBeInTheDocument();
  expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(12);
});

it("조건을 바꿔 재조회하는 동안에는 스켈레톤으로 돌아가지 않고 직전 목록이 유지된다", async () => {
  const user = userEvent.setup();
  renderWithProviders(<ProductListContent />);
  await screen.findByText("총 25개");

  await user.selectOptions(screen.getByLabelText("카테고리"), "casual");
  expect(screen.queryByRole("region", { name: "상품 목록 불러오는 중" })).not.toBeInTheDocument();
  expect(screen.getAllByRole("heading", { level: 2 }).length).toBeGreaterThanOrEqual(5);

  await screen.findByText("총 5개");
  expect(screen.queryByRole("region", { name: "상품 목록 불러오는 중" })).not.toBeInTheDocument();
});

it("결과가 0개면 '검색 결과가 없어요' 안내가 보인다", async () => {
  server.use(
    http.get("/api/products", () =>
      HttpResponse.json({ ...buildProductListResponse(), products: [], totalCount: 0 }),
    ),
  );
  renderWithProviders(<ProductListContent />);

  await screen.findByText("검색 결과가 없어요");
  expect(screen.getByText("총 0개")).toBeInTheDocument();
  expect(screen.queryByText("존재하지 않는 페이지예요")).not.toBeInTheDocument();
});

it("결과는 있지만 범위 밖 페이지면 마지막 페이지로 이동을 안내한다", async () => {
  server.use(
    http.get("/api/products", () =>
      HttpResponse.json({ ...buildProductListResponse(), products: [] }),
    ),
  );
  renderWithProviders(<ProductListContent />);

  await screen.findByText("존재하지 않는 페이지예요");
  expect(screen.getByText("마지막 페이지는 3페이지예요.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "마지막 페이지로 이동" })).toBeInTheDocument();
  expect(screen.queryByText("검색 결과가 없어요")).not.toBeInTheDocument();
});

it("서버가 500과 message를 주면 알림에 그 문구가 그대로 보이고 다시 시도 버튼이 있다", async () => {
  server.use(
    http.get("/api/products", () =>
      HttpResponse.json({ message: "서버 점검 중" }, { status: 500 }),
    ),
  );
  renderWithProviders(<ProductListContent />);

  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("상품을 불러오지 못했어요");
  expect(alert).toHaveTextContent("서버 점검 중");
  expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
});

it("message 없는 500이면 기본 안내 문구가 보인다", async () => {
  server.use(http.get("/api/products", () => new HttpResponse(null, { status: 500 })));
  renderWithProviders(<ProductListContent />);

  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("요청을 처리하지 못했습니다.");
});

it("첫 요청이 실패해도 다시 시도를 누르면 목록이 복구된다", async () => {
  const user = userEvent.setup();
  server.use(
    http.get("/api/products", () => new HttpResponse(null, { status: 500 }), { once: true }),
  );
  renderWithProviders(<ProductListContent />);
  await screen.findByRole("alert");

  await user.click(screen.getByRole("button", { name: "다시 시도" }));

  await screen.findByText("총 25개");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("캐시가 있는 상태에서 재조회가 실패하면 기존 목록을 유지한 채 갱신 실패 배너가 보인다", async () => {
  const { queryClient } = renderWithProviders(<ProductListContent />);
  await screen.findByText("총 25개");

  server.use(
    http.get("/api/products", () =>
      HttpResponse.json({ message: "서버 점검 중" }, { status: 500 }),
    ),
  );
  void queryClient.invalidateQueries();

  const banner = await screen.findByRole("alert");
  expect(banner).toHaveTextContent("목록을 갱신하지 못했어요");
  expect(banner).toHaveTextContent("서버 점검 중");
  expect(screen.getByText("총 25개")).toBeInTheDocument();
  expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(12);
});
