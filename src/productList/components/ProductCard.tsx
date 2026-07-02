import type { Product } from "../types";
import { formatPrice, getProductBadges } from "../utils/productCard";
import { HighlightText } from "./HighlightText";

interface ProductCardProps {
  product: Product;
  searchQuery: string;
  isWished: boolean;
  onToggle: (id: number) => void;
  onClick: (id: number) => void;
}

export function ProductCard({
  product,
  searchQuery,
  isWished,
  onToggle,
  onClick,
}: ProductCardProps) {
  const {
    discountRate,
    isNew,
    isHot,
    isBest,
    isSoldOut,
    isAlmostSoldOut,
    isFreeShipping,
  } = getProductBadges(product, new Date());
  const formattedPrice = formatPrice(product.price);
  const formattedOriginal = product.originalPrice
    ? formatPrice(product.originalPrice)
    : null;

  return (
    <article
      key={product.id}
      className="product-card"
      onClick={() => onClick(product.id)}
    >
      <div className="image-wrap">
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
        {discountRate > 0 && (
          <span className="badge badge-discount">{discountRate}% 할인</span>
        )}
        {isNew && <span className="badge badge-new">NEW</span>}
        {isHot && <span className="badge badge-hot">특가</span>}
        {isBest && <span className="badge badge-best">BEST</span>}
        {isSoldOut && <span className="badge badge-soldout">품절</span>}
        {!isSoldOut && isAlmostSoldOut && (
          <span className="badge badge-warning">품절 임박</span>
        )}
      </div>

      <div className="card-body">
        <h3 className="product-name">
          <HighlightText query={searchQuery} text={product.name} />
        </h3>
        <div className="price-area">
          {formattedOriginal && (
            <span className="original-price">{formattedOriginal}</span>
          )}
          <span className="price">{formattedPrice}</span>
          {isFreeShipping && (
            <span
              style={{
                marginLeft: 6,
                fontSize: 11,
                color: "#2e7d32",
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
              marginLeft: "auto",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 16,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(product.id);
            }}
            aria-label="위시리스트 토글"
          >
            {isWished ? "♥" : "♡"}
          </button>
        </div>
      </div>
    </article>
  );
}
