export type PerformanceLabProduct = {
  id: string
  name: string
  image: string
}

export const performanceLabProducts: Array<PerformanceLabProduct> = Array.from(
  { length: 24 },
  (_, index) => {
    const productNumber = String(index + 1)

    return {
      id: `p${productNumber}`,
      name: `성능 측정 상품 ${productNumber}`,
      image: `/images/products/p${productNumber}.jpg`,
    }
  },
)

export function calculateCardPresentation(
  productId: string,
  selected: boolean,
) {
  const productSeed = Array.from(productId).reduce(
    (sum, character) => sum + character.charCodeAt(0),
    selected ? 31 : 17,
  )
  let checksum = productSeed

  for (let index = 0; index < 150_000; index += 1) {
    checksum = (checksum * 33 + productSeed + index) % 1_000_003
  }

  return checksum
}
