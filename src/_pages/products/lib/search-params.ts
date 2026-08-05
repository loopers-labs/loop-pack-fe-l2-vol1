import type { CategoryId, ProductSort } from "@/types/commerce";
import {
  createParser,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringLiteral,
  type inferParserType,
} from "nuqs";

const parseAsPositiveInteger = createParser({
  parse: (value) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isSafeInteger(parsed) || parsed < 1) {
      return null;
    }
    return parsed;
  },
  serialize: (value) => String(value),
});

export const pageSizeValues = [6, 12, 24] as const;

export const categoryFilterOptions = [
  { value: "all", label: "전체" },
  { value: "casual", label: "캐주얼" },
  { value: "fashion", label: "패션" },
  { value: "goods", label: "뷰티·잡화" },
  { value: "home", label: "홈" },
  { value: "digital", label: "디지털" },
] as const satisfies readonly { value: "all" | CategoryId; label: string }[];

const categoryFilterValues = categoryFilterOptions.map((option) => option.value);

export const scenarioValues = ["slow", "empty", "error"] as const;

export const productSearchParsers = {
  q: parseAsString.withDefault(""),
  scenario: parseAsStringLiteral(scenarioValues),
  category: parseAsStringLiteral(categoryFilterValues).withDefault("all"),
  sort: parseAsStringLiteral([
    "latest",
    "popular",
    "price-asc",
    "price-desc",
  ] as const satisfies readonly ProductSort[]).withDefault("latest"),
  page: parseAsPositiveInteger.withDefault(1),
  pageSize: parseAsNumberLiteral(pageSizeValues).withDefault(12),
};

export type ProductSearchState = inferParserType<typeof productSearchParsers>;
