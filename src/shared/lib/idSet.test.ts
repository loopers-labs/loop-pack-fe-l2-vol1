import { describe, expect, it } from "vitest";
import { countIds, toggleId, type IdSet } from "./idSet";

// 1번 항목 — 장바구니·위시리스트 개수 파생.
// 개수를 저장하지 않고 담긴 id 수에서 뽑는다는 5주차 결정이 이 두 함수에 있다.
// 헤더에 실제로 반영되는지는 12번(통합)이 본다.

describe("toggleId", () => {
  it("없는 id를 주면 넣는다", () => {
    expect(toggleId({}, "p1")).toEqual({ p1: true });
  });

  it("이미 있는 id를 다시 주면 뺀다", () => {
    expect(toggleId({ p1: true }, "p1")).toEqual({});
  });

  it("같은 id를 두 번 토글하면 처음 상태로 돌아온다", () => {
    // 담기 버튼을 두 번 누르면 안 담긴 상태여야 한다.
    // add-only로 구현되면 여기서 { p1: true }가 남는다.
    expect(toggleId(toggleId({}, "p1"), "p1")).toEqual({});
  });

  it("다른 id를 토글해도 기존 id는 남는다", () => {
    expect(toggleId({ p1: true }, "p2")).toEqual({ p1: true, p2: true });
  });

  it("원본을 바꾸지 않고 새 객체를 준다", () => {
    // zustand는 참조가 바뀌어야 리렌더한다. 제자리 수정이면 화면이 갱신되지 않는다.
    const before: IdSet = { p1: true };
    const after = toggleId(before, "p2");

    expect(before).toEqual({ p1: true });
    expect(after).not.toBe(before);
  });
});

describe("countIds", () => {
  it("빈 집합은 0이다", () => {
    expect(countIds({})).toBe(0);
  });

  it("담긴 id 수를 그대로 센다", () => {
    expect(countIds({ p1: true, p2: true, p3: true })).toBe(3);
  });

  it("같은 id를 두 번 담아도 1이다", () => {
    // 개수를 따로 저장했다면 여기서 2가 된다 — 파생이라 그럴 수 없다.
    const twice = toggleId(toggleId({}, "p1"), "p1");
    expect(countIds(toggleId(twice, "p1"))).toBe(1);
  });
});
