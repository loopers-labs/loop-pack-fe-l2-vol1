import type { Product } from "./types.ts";
import { computeBadges } from "./productBadges.ts";
import { escapeRegExp, splitByMatch } from "./highlight.ts";
import type { QueryFilters } from "./filterQuery.ts";
import { FILTER_DEFAULTS, parseQueryToFilters, serializeFiltersToQuery } from "./filterQuery.ts";
import { toggleId, addRecentId } from "./listOps.ts";

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)} got ${JSON.stringify(actual)}`);
  }
}

// ── productBadges ──────────────────────────────────────────
const NOW = new Date("2026-07-04T00:00:00.000Z");

const baseProduct: Product = {
  id: 1,
  name: "테스트 상품",
  category: "electronics",
  price: 10000,
  stock: 10,
  imageUrl: "https://example.com/img.png",
  createdAt: "2026-06-27T00:00:00.000Z",
  rating: 4.0,
  reviewCount: 10,
};

assertEqual(
  computeBadges(baseProduct, NOW).discountRate,
  0,
  "discountRate: originalPrice 없으면 0",
);

assertEqual(
  computeBadges({ ...baseProduct, price: 49999 }, NOW).isFreeShipping,
  false,
  "isFreeShipping: 49999 미만은 false",
);
assertEqual(
  computeBadges({ ...baseProduct, price: 50000 }, NOW).isFreeShipping,
  true,
  "isFreeShipping: 50000 이상은 true",
);

assertEqual(
  computeBadges({ ...baseProduct, createdAt: "2026-06-27T00:00:00.000Z" }, NOW).isNew,
  true,
  "isNew: 정확히 7일 경과는 true",
);
assertEqual(
  computeBadges({ ...baseProduct, createdAt: "2026-06-26T00:00:00.000Z" }, NOW).isNew,
  false,
  "isNew: 8일 경과는 false",
);

assertEqual(
  computeBadges({ ...baseProduct, price: 700, originalPrice: 1000 }, NOW).isHot,
  true,
  "isHot: discountRate 30은 true",
);
assertEqual(
  computeBadges({ ...baseProduct, price: 710, originalPrice: 1000 }, NOW).isHot,
  false,
  "isHot: discountRate 29는 false",
);

assertEqual(
  computeBadges({ ...baseProduct, rating: 4.5, reviewCount: 100 }, NOW).isBest,
  true,
  "isBest: rating 4.5 & reviewCount 100은 true",
);
assertEqual(
  computeBadges({ ...baseProduct, rating: 4.4, reviewCount: 100 }, NOW).isBest,
  false,
  "isBest: rating 미달은 false",
);
assertEqual(
  computeBadges({ ...baseProduct, rating: 4.5, reviewCount: 99 }, NOW).isBest,
  false,
  "isBest: reviewCount 미달은 false",
);

assertEqual(
  computeBadges({ ...baseProduct, stock: 0 }, NOW).isSoldOut,
  true,
  "isSoldOut: stock 0은 true",
);
assertEqual(
  computeBadges({ ...baseProduct, stock: 0 }, NOW).isAlmostSoldOut,
  false,
  "isAlmostSoldOut: soldOut이면 배타적으로 false",
);
assertEqual(
  computeBadges({ ...baseProduct, stock: 5 }, NOW).isAlmostSoldOut,
  true,
  "isAlmostSoldOut: stock 5는 true",
);
assertEqual(
  computeBadges({ ...baseProduct, stock: 5 }, NOW).isSoldOut,
  false,
  "isSoldOut: stock 5는 false",
);
assertEqual(
  computeBadges({ ...baseProduct, stock: 6 }, NOW).isAlmostSoldOut,
  false,
  "isAlmostSoldOut: stock 6은 false",
);

const coexist = computeBadges(
  {
    ...baseProduct,
    price: 700,
    originalPrice: 1000,
    rating: 4.8,
    reviewCount: 200,
    createdAt: "2026-07-01T00:00:00.000Z",
  },
  NOW,
);
assertEqual(
  coexist.isHot && coexist.isBest && coexist.isNew,
  true,
  "배지 공존: hot·best·new 동시 true 가능",
);

// ── highlight ───────────────────────────────────────────────
assertEqual(
  escapeRegExp("a.b*c(d)"),
  "a\\.b\\*c\\(d\\)",
  "escapeRegExp: 정규식 특수문자 이스케이프",
);

assertEqual(
  splitByMatch("hello", ""),
  [{ text: "hello", isMatch: false }],
  "splitByMatch: 빈 query는 단일 non-match 세그먼트",
);

assertEqual(
  splitByMatch("hello", "ell"),
  [
    { text: "h", isMatch: false },
    { text: "ell", isMatch: true },
    { text: "o", isMatch: false },
  ],
  "splitByMatch: 기본 매치 분할",
);

assertEqual(
  splitByMatch("a+b", "+"),
  [
    { text: "a", isMatch: false },
    { text: "+", isMatch: true },
    { text: "b", isMatch: false },
  ],
  "splitByMatch: query의 정규식 특수문자도 리터럴로 매치",
);

assertEqual(
  splitByMatch("HELLO world", "hello"),
  [
    { text: "", isMatch: false },
    { text: "HELLO", isMatch: true },
    { text: " world", isMatch: false },
  ],
  "splitByMatch: 대소문자 무시 매치",
);

// ── filterQuery ─────────────────────────────────────────────
assertEqual(parseQueryToFilters(""), FILTER_DEFAULTS, "parseQueryToFilters: 빈 문자열은 기본값");
assertEqual(
  serializeFiltersToQuery(FILTER_DEFAULTS),
  "",
  "serializeFiltersToQuery: 기본값은 빈 쿼리",
);

assertEqual(
  parseQueryToFilters("?category=bogus").category,
  "all",
  "parseQueryToFilters: category allowlist 밖이면 all",
);
assertEqual(
  parseQueryToFilters("?sort=bogus").sortBy,
  "latest",
  "parseQueryToFilters: sort allowlist 밖이면 latest",
);
assertEqual(
  parseQueryToFilters("?category=fashion").category,
  "fashion",
  "parseQueryToFilters: category allowlist 안은 그대로",
);

assertEqual(
  parseQueryToFilters("?page=abc").page,
  1,
  "parseQueryToFilters: page 비정수 문자열은 1",
);
assertEqual(parseQueryToFilters("?page=-3").page, 1, "parseQueryToFilters: page 음수는 1");
assertEqual(parseQueryToFilters("?page=0").page, 1, "parseQueryToFilters: page 0은 1");
assertEqual(parseQueryToFilters("?page=3.5").page, 1, "parseQueryToFilters: page 소수는 1");
assertEqual(
  parseQueryToFilters("?page=999").page,
  999,
  "parseQueryToFilters: page 양의정수는 상한 클램프 없이 통과",
);

assertEqual(
  parseQueryToFilters("?minPrice=-5").minPrice,
  "",
  "parseQueryToFilters: minPrice 음수는 빈 문자열",
);
assertEqual(
  parseQueryToFilters("?minPrice=abc").minPrice,
  "",
  "parseQueryToFilters: minPrice 비숫자는 빈 문자열",
);
assertEqual(
  parseQueryToFilters("?minPrice=100").minPrice,
  100,
  "parseQueryToFilters: minPrice 유효값은 숫자로",
);

assertEqual(
  parseQueryToFilters("?inStock=true").inStockOnly,
  true,
  "parseQueryToFilters: inStock=true는 true",
);
assertEqual(
  parseQueryToFilters("?inStock=yes").inStockOnly,
  false,
  "parseQueryToFilters: inStock 이외 값은 false",
);

assertEqual(
  parseQueryToFilters("?foo=bar&category=fashion").category,
  "fashion",
  "parseQueryToFilters: 모르는 param은 무시하고 나머지는 정상 파싱",
);

const roundTripFilters: QueryFilters = {
  category: "electronics",
  minPrice: 1000,
  maxPrice: "",
  sortBy: "popular",
  searchQuery: "phone case",
  inStockOnly: true,
  page: 2,
};
const serialized = serializeFiltersToQuery(roundTripFilters);
assertEqual(
  serialized,
  "category=electronics&q=phone+case&page=2&sort=popular&minPrice=1000&inStock=true",
  "serializeFiltersToQuery: 원본 URL write set 그대로 mirror",
);
assertEqual(
  parseQueryToFilters(serialized),
  roundTripFilters,
  "parseQueryToFilters/serializeFiltersToQuery: 왕복 일치",
);

// ── listOps ─────────────────────────────────────────────────
assertEqual(toggleId([1, 2], 3), [1, 2, 3], "toggleId: 없는 id는 끝에 추가");
assertEqual(toggleId([1, 2, 3], 2), [1, 3], "toggleId: 있는 id는 제거");
assertEqual(
  toggleId(toggleId([1, 2], 5), 5),
  [1, 2],
  "toggleId: 추가 후 재토글하면 원본과 동일(중복 없음)",
);

assertEqual(addRecentId([1, 2, 3], 2, 10), [2, 1, 3], "addRecentId: 중복 제거 후 맨 앞으로");
assertEqual(addRecentId([1, 2, 3], 4, 3), [4, 1, 2], "addRecentId: max 길이로 자름");
assertEqual(addRecentId([1, 2, 3], 5), [5, 1, 2, 3], "addRecentId: 기본 max=10");
