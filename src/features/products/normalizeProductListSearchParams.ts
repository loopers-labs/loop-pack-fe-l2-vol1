import { createLoader, createSerializer } from "nuqs/server";
import { productListSearchParams } from "./searchParams";
import type { SearchParams } from "nuqs/server";

const loadProductListSearchParams = createLoader(productListSearchParams);
const serializeProductListSearchParams = createSerializer(productListSearchParams, {
  clearOnDefault: true,
});

const PRODUCT_LIST_PATH = "/products";

export function getProductListRedirectPath(searchParams: SearchParams) {
  if (isValidProductListSearchParams(searchParams)) {
    return null;
  }

  const parsedParams = loadProductListSearchParams(searchParams);
  const baseUrl = createProductListUrl(searchParams);

  return serializeProductListSearchParams(baseUrl, parsedParams);
}

function isValidProductListSearchParams(searchParams: SearchParams) {
  try {
    loadProductListSearchParams(searchParams, { strict: true });
    return true;
  } catch {
    return false;
  }
}

function createProductListUrl(searchParams: SearchParams) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    const firstValue = Array.isArray(value) ? value[0] : value;

    if (firstValue !== undefined) {
      params.set(key, firstValue);
    }
  }

  const queryString = params.toString();

  return queryString ? `${PRODUCT_LIST_PATH}?${queryString}` : PRODUCT_LIST_PATH;
}
