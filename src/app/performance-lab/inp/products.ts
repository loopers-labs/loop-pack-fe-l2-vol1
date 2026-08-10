export type PerformanceLabProduct = {
  id: string;
  name: string;
  image: string;
};

export const performanceLabProducts: PerformanceLabProduct[] = Array.from(
  { length: 24 },
  (_, index) => ({
    id: `p${index + 1}`,
    name: `성능 측정 상품 ${index + 1}`,
    image: `/images/products/p${index + 1}.jpg`,
  })
);

// [AI] starter의 function 선언을 func-style 규칙에 맞춰 화살표 함수로 변경.
export const calculateCardPresentation = (productId: string, selected: boolean) => {
  const productSeed = Array.from(productId).reduce(
    (sum, character) => sum + character.charCodeAt(0),
    selected ? 31 : 17
  );
  let checksum = productSeed;

  for (let index = 0; index < 150_000; index += 1) {
    checksum = (checksum * 33 + productSeed + index) % 1_000_003;
  }

  return checksum;
};
