export function formatPrice(price: number) {
  return `${price.toLocaleString()}원`
}

export function getDiscountRate(product: {
  price: number
  originalPrice?: number
}) {
  return product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0
}

export function isSoldOut(product: { stock: number }) {
  return product.stock === 0
}

export function isAlmostSoldOut(product: { stock: number }) {
  return product.stock > 0 && product.stock <= 5
}

export function isHotDeal(product: { discountRate: number }) {
  return product.discountRate >= 30
}

export function isBestSeller(product: { rating: number; reviewCount: number }) {
  return product.rating >= 4.5 && product.reviewCount >= 100
}

export function isFreeShipping(product: { price: number }) {
  return product.price >= 50000
}

export function isNewProduct(product: { createdAt: string; now?: Date }) {
  const createdDate = new Date(product.createdAt)
  const now = product.now ?? new Date()
  const daysSinceCreated = Math.floor(
    (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24),
  )

  return daysSinceCreated <= 7
}
