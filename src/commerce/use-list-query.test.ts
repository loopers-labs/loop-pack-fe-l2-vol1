import { describe, expect, it } from "vitest";
import { CATEGORY_FILTER_VALUES, LIST_QUERY_PARSERS, PAGE_SIZE } from "./use-list-query";

// use-list-query 훅 자체는 renderHook으로 부르지 않는다 — README.md `## 상태 소유권` >
// `use-list-query 검증 표면`에 기록된 판단대로, 훅의 사용자는 list-view 컴포넌트이므로
// 동작 검증(URL 파싱·page 리셋·요청 직렬화)은 list-view 렌더 스위트(웨이브 3)가 맡는다.
// 여기서는 모듈 표면(named export)과 nuqs 파서 맵의 정적 구성만 확인한다.
// 커버하지 못하는 것: 이 파일은 파서 맵이 모듈 스코프 export로 남아있는지만 본다 —
// 누군가 useListQuery() 내부에 별도 인라인 파서 맵을 새로 만드는 회귀는 이 스위트가
// 잡지 못한다(export된 LIST_QUERY_PARSERS는 그대로 두고 훅이 그걸 안 쓰게 되어도 초록).
describe("LIST_QUERY_PARSERS", () => {
  it.each(["q", "category", "sort", "page"] as const)(
    "%s 파서는 withDefault를 가진다(defaultValue가 undefined가 아니다)",
    (key) => {
      expect(LIST_QUERY_PARSERS[key].defaultValue).toBeDefined();
    },
  );

  it.each(["q", "category", "sort", "page"] as const)(
    "%s 파서는 history: push 옵션을 가진다",
    (key) => {
      expect(LIST_QUERY_PARSERS[key].history).toBe("push");
    },
  );
});

describe("PAGE_SIZE", () => {
  it("named export이고 값이 12다", () => {
    expect(PAGE_SIZE).toBe(12);
  });
});

describe("CATEGORY_FILTER_VALUES", () => {
  it("named export이고 5개 카테고리 + all을 담는다", () => {
    expect(CATEGORY_FILTER_VALUES).toHaveLength(6);
    expect([...CATEGORY_FILTER_VALUES].sort()).toEqual(
      ["all", "casual", "digital", "fashion", "goods", "home"].sort(),
    );
  });
});
