import type { CATEGORY_IDS } from "./constants";

export type CategoryId = (typeof CATEGORY_IDS)[number];

export type Category = {
  id: CategoryId;
  name: string;
};
