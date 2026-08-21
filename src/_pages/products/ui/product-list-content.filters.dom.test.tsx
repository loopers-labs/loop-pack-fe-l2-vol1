import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { renderWithProviders } from "@/test/render-with-providers";
import { ProductListContent } from "./product-list-content";

it("카테고리를 캐주얼로 바꾸면 해당 카테고리 상품만 남는다", async () => {
  const user = userEvent.setup();
  renderWithProviders(<ProductListContent />);
  await screen.findByText("총 25개");

  await user.selectOptions(screen.getByLabelText("카테고리"), "casual");

  await screen.findByText("총 5개");
  expect(
    screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
  ).toEqual(["casual-1", "casual-2", "casual-3", "casual-4", "casual-5"]);
});

it("2페이지에서 카테고리를 바꾸면 1페이지로 돌아간다", async () => {
  const user = userEvent.setup();
  renderWithProviders(<ProductListContent />);
  await screen.findByText("총 25개");
  await user.click(screen.getByRole("button", { name: "다음" }));
  await screen.findByText("2 / 3");

  await user.selectOptions(screen.getByLabelText("카테고리"), "casual");

  await screen.findByText("1 / 1");
  expect(screen.getByRole("heading", { level: 2, name: "casual-1" })).toBeInTheDocument();
  expect(screen.queryByText("존재하지 않는 페이지예요")).not.toBeInTheDocument();
});

it("정렬을 높은 가격순으로 바꾸면 목록이 가격 내림차순으로 재배열된다", async () => {
  const user = userEvent.setup();
  renderWithProviders(<ProductListContent />);
  await screen.findByText("총 25개");
  expect(
    screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
  ).toEqual([
    "casual-1",
    "casual-2",
    "casual-3",
    "casual-4",
    "casual-5",
    "fashion-1",
    "fashion-2",
    "fashion-3",
    "fashion-4",
    "fashion-5",
    "goods-1",
    "goods-2",
  ]);

  await user.selectOptions(screen.getByLabelText("정렬"), "price-desc");

  await screen.findByRole("heading", { level: 2, name: "digital-5" });
  expect(
    screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
  ).toEqual([
    "digital-5",
    "digital-4",
    "digital-3",
    "digital-2",
    "digital-1",
    "home-5",
    "home-4",
    "home-3",
    "home-2",
    "home-1",
    "goods-5",
    "goods-4",
  ]);
});

it("2페이지에서 정렬을 바꾸면 1페이지로 돌아간다", async () => {
  const user = userEvent.setup();
  renderWithProviders(<ProductListContent />);
  await screen.findByText("총 25개");
  await user.click(screen.getByRole("button", { name: "다음" }));
  await screen.findByText("2 / 3");

  await user.selectOptions(screen.getByLabelText("정렬"), "price-desc");

  await screen.findByText("1 / 3");
  await screen.findByRole("heading", { level: 2, name: "digital-5" });
});

it("다음을 누르면 2페이지 상품으로 바뀌고 페이지 표시가 갱신된다", async () => {
  const user = userEvent.setup();
  renderWithProviders(<ProductListContent />);
  await screen.findByText("총 25개");

  await user.click(screen.getByRole("button", { name: "다음" }));

  await screen.findByRole("heading", { level: 2, name: "goods-3" });
  expect(
    screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
  ).toEqual([
    "goods-3",
    "goods-4",
    "goods-5",
    "home-1",
    "home-2",
    "home-3",
    "home-4",
    "home-5",
    "digital-1",
    "digital-2",
    "digital-3",
    "digital-4",
  ]);
  expect(screen.getByText("2 / 3")).toBeInTheDocument();
});

it("1페이지에서는 이전이, 마지막 페이지에서는 다음이 비활성화된다", async () => {
  const user = userEvent.setup();
  renderWithProviders(<ProductListContent />);
  await screen.findByText("총 25개");
  expect(screen.getByRole("button", { name: "이전" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "다음" })).toBeEnabled();

  await user.click(screen.getByRole("button", { name: "다음" }));
  await screen.findByText("2 / 3");
  await user.click(screen.getByRole("button", { name: "다음" }));

  await screen.findByText("3 / 3");
  await screen.findByRole("heading", { level: 2, name: "digital-5" });
  expect(screen.getByRole("button", { name: "다음" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "이전" })).toBeEnabled();
});
