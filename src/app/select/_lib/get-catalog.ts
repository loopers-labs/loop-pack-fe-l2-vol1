import type { ProductCatalog } from "../_types/product";

import { selectDemoCatalog } from "../_data/catalog";

export function getCatalog(): ProductCatalog {
  return selectDemoCatalog;
}
