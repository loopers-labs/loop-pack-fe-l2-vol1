export const ADVANCED_A_CARD_COUNT = 24;

export type AdvancedAProduct = Readonly<{
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  calculationSeed: number;
}>;

export function createAdvancedAProducts(): AdvancedAProduct[] {
  return Array.from({ length: ADVANCED_A_CARD_COUNT }, (_, index) => {
    const sequence = index + 1;
    const paddedSequence = String(sequence).padStart(2, "0");

    return {
      id: `week07-product-${paddedSequence}`,
      name: `에어리 데일리 셔츠 ${paddedSequence}`,
      category: "상의",
      price: 32_900 + index * 1_000,
      imageUrl: `/images/products/p${sequence}.jpg`,
      calculationSeed: sequence,
    };
  });
}
