import { ADVANCED_A_CARD_COUNT } from "./_data/advanced-a-products";

export function resolveAdvancedAPageSize(
  requestedPageSize: string | undefined,
): number {
  const parsedPageSize = Number.parseInt(requestedPageSize ?? "", 10);

  if (parsedPageSize !== ADVANCED_A_CARD_COUNT) {
    return ADVANCED_A_CARD_COUNT;
  }

  return parsedPageSize;
}
