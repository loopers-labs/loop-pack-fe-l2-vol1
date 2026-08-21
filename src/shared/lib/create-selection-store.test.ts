import { expect, it } from "vitest";
import { createSelectionStore } from "./create-selection-store";

it("toggle 1회면 해당 id가 담기고 개수가 1이 된다", () => {
  const store = createSelectionStore();
  store.getState().toggle("product-1");
  expect(store.getState().ids.has("product-1")).toBe(true);
  expect(store.getState().ids.size).toBe(1);
});

it("같은 id를 두 번 toggle하면 빠져서 개수가 0으로 돌아간다", () => {
  const store = createSelectionStore();
  store.getState().toggle("product-1");
  store.getState().toggle("product-1");
  expect(store.getState().ids.has("product-1")).toBe(false);
  expect(store.getState().ids.size).toBe(0);
});

it("서로 다른 id 두 개를 toggle하면 개수가 2가 된다", () => {
  const store = createSelectionStore();
  store.getState().toggle("product-1");
  store.getState().toggle("product-2");
  expect(store.getState().ids.size).toBe(2);
});

it("toggle은 이전 상태의 ids와 참조가 다른 새 Set을 만든다", () => {
  const store = createSelectionStore();
  store.getState().toggle("product-1");
  const before = store.getState().ids;
  store.getState().toggle("product-2");
  expect(store.getState().ids).not.toBe(before);
});
