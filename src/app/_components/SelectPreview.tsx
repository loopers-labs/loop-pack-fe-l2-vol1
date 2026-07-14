import { SizeOptionSelect } from '@/components/ui/select/SizeOptionSelect'
import { TextOptionSelect } from '@/components/ui/select/TextOptionSelect'
import { ThumbnailOptionSelect } from '@/components/ui/select/ThumbnailOptionSelect'
import { getProducts, getPurchaseOptions, getSizes } from '@/services/product-options'
import type { Product, ThumbnailSelectOption } from '@/types/product-options'
import { PreviewCard } from './PreviewCard'

function toThumbnailOptions(products: Product[]): ThumbnailSelectOption[] {
  return products.map((product) => ({
    id: product.id,
    image: product.image,
    label: product.name,
    price: product.price,
    discountRate: product.discountRate,
    badge: product.badge,
    bundleBadge: product.bundleBadge,
    stock: product.stock,
  }))
}

export const SelectPreview = () => {
  const products = getProducts()
  const sizeOptions = getSizes()
  const textOptions = getPurchaseOptions()
  const thumbnailOptions = toThumbnailOptions(products)

  return (
    <>
      <PreviewCard title="TextOptionSelect" description="이름·총액·1개당 단가·배지 조합, 품절 스킵">
        <TextOptionSelect title="옵션 선택" options={textOptions} />
      </PreviewCard>
      <PreviewCard title="SizeOptionSelect" description="재고(stock) 기반 품절 판정, 배송 문구">
        <SizeOptionSelect title="사이즈" options={sizeOptions} />
      </PreviewCard>
      <PreviewCard title="ThumbnailOptionSelect" description="썸네일 + 할인율/배지/묶음배지 조합">
        <ThumbnailOptionSelect title="옵션을 선택해 주세요" options={thumbnailOptions} />
      </PreviewCard>
    </>
  )
}
