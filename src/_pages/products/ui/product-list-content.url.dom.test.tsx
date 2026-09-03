import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UrlUpdateEvent } from "nuqs/adapters/testing";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render-with-providers";
import { ProductListContent } from "./product-list-content";

it("카테고리를 바꾸면 URL에 category가 실리고 기본값으로 리셋된 page는 생략된다", async () => {
  const user = userEvent.setup();
  const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
  renderWithProviders(<ProductListContent />, { onUrlUpdate });
  await screen.findByText("총 25개");
  await user.click(screen.getByRole("button", { name: "다음" }));
  await screen.findByText("2 / 3");

  await user.selectOptions(screen.getByLabelText("카테고리"), "casual");
  await screen.findByText("총 5개");

  const lastEvent = onUrlUpdate.mock.calls.at(-1)?.[0];
  expect(lastEvent?.searchParams.get("category")).toBe("casual");
  expect(lastEvent?.searchParams.get("page")).toBeNull();
  expect(lastEvent?.searchParams.get("sort")).toBeNull();
  expect(lastEvent?.searchParams.get("pageSize")).toBeNull();
});

it("category와 sort가 담긴 URL로 재진입하면 select 값과 목록이 그 조건으로 시작한다", async () => {
  renderWithProviders(<ProductListContent />, {
    searchParams: "?category=casual&sort=price-desc",
  });
  expect(screen.getByLabelText("카테고리")).toHaveValue("casual");
  expect(screen.getByLabelText("정렬")).toHaveValue("price-desc");
  expect(screen.getByLabelText("페이지 크기")).toHaveValue("12");

  await screen.findByText("총 5개");
  expect(
    screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
  ).toEqual(["casual-5", "casual-4", "casual-3", "casual-2", "casual-1"]);
});
