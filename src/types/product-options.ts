export type Product = {
  id: string
  name: string
  image: string
  price: number
  discountRate?: number
  badge?: string
  bundleBadge?: string
  stock: number
}

export type SizeSelectOption = {
  value: number
  stock: number
  deliveryText?: string
}

export type TextSelectOption = {
  id: string
  label: string
  isMaxDiscount: boolean
  price: number
  unitPrice: number
  isFreeShipping: boolean
  stock: number
}

export type ThumbnailSelectOption = {
  id: string
  image: string
  label: string
  price: number
  discountRate?: number
  badge?: string
  bundleBadge?: string
  stock: number
}
