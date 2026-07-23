import type { CategoryId } from "@/types/commerce";
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

const categoryFilterValues = [
  "all",
  "casual",
  "fashion",
  "goods",
  "home",
  "digital",
] as const satisfies readonly ("all" | CategoryId)[];

export const productSearchParsers = {
  q: parseAsString.withDefault(""),
  category: parseAsStringLiteral(categoryFilterValues).withDefault("all"),
  sort: parseAsStringLiteral(["latest", "popular", "price-asc", "price-desc"] as const).withDefault(
    "latest",
  ),
  page: parseAsPositiveInteger.withDefault(1),
  pageSize: parseAsNumberLiteral(pageSizeValues).withDefault(12),
};

export type ProductSearchState = inferParserType<typeof productSearchParsers>;
