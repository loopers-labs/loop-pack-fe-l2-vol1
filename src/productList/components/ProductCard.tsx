import type { Product } from '../types'
import {
  formatPrice,
  getDiscountRate,
  isAlmostSoldOut,
  isBestSeller,
  isFreeShipping,
  isHotDeal,
  isNewProduct,
  isSoldOut,
} from '../utils/productRules'
import { splitHighlightedText } from '../utils/textHighlight'

type ProductCardProps = {
  product: Product
  searchQuery: string
  isWished: boolean
  onProductClick: (productId: number) => void
  onToggleWishlist: (productId: number) => void
}

function HighlightedText({
  text,
  searchQuery,
}: {
  text: string
  searchQuery: string
}) {
  const parts = splitHighlightedText(text, searchQuery)
  let offset = 0

  return (
    <>
      {parts.map((part) => {
        const key = `${part.text}-${offset}`
        offset += part.text.length

        return part.isMatch ? (
          <mark key={key} style={{ background: '#fff176', padding: 0 }}>
            {part.text}
          </mark>
        ) : (
          <span key={key}>{part.text}</span>
        )
      })}
    </>
  )
}

export function ProductCard({
  product,
  searchQuery,
  isWished,
  onProductClick,
  onToggleWishlist,
}: ProductCardProps) {
  const discountRate = getDiscountRate(product)
  const formattedPrice = formatPrice(product.price)
  const formattedOriginal =
    product.originalPrice !== undefined
      ? formatPrice(product.originalPrice)
      : null
  const productIsAlmostSoldOut = isAlmostSoldOut(product)
  const productIsSoldOut = isSoldOut(product)
  const isHot = isHotDeal({ discountRate })
  const isBest = isBestSeller(product)
  const productIsFreeShipping = isFreeShipping(product)
  const isNew = isNewProduct(product)

  return (
    <article
      className="product-card"
      onClick={() => onProductClick(product.id)}
    >
      <div className="image-wrap">
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
        {discountRate > 0 && (
          <span className="badge badge-discount">{discountRate}% 할인</span>
        )}
        {isNew && <span className="badge badge-new">NEW</span>}
        {isHot && <span className="badge badge-hot">특가</span>}
        {isBest && <span className="badge badge-best">BEST</span>}
        {productIsSoldOut && <span className="badge badge-soldout">품절</span>}
        {!productIsSoldOut && productIsAlmostSoldOut && (
          <span className="badge badge-warning">품절 임박</span>
        )}
      </div>

      <div className="card-body">
        <h3 className="product-name">
          <HighlightedText text={product.name} searchQuery={searchQuery} />
        </h3>
        <div className="price-area">
          {formattedOriginal && (
            <span className="original-price">{formattedOriginal}</span>
          )}
          <span className="price">{formattedPrice}</span>
          {productIsFreeShipping && (
            <span
              style={{
                marginLeft: 6,
                fontSize: 11,
                color: '#2e7d32',
                fontWeight: 600,
              }}
            >
              무료배송
            </span>
          )}
        </div>
        <div className="rating-area">
          <span className="rating">★ {product.rating.toFixed(1)}</span>
          <span className="review-count">
            ({product.reviewCount.toLocaleString()})
          </span>
          <button
            style={{
              marginLeft: 'auto',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 16,
            }}
            onClick={(event) => {
              event.stopPropagation()
              onToggleWishlist(product.id)
            }}
            aria-label="위시리스트 토글"
          >
            {isWished ? '♥' : '♡'}
          </button>
        </div>
      </div>
    </article>
  )
}
