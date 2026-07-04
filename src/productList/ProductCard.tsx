import type { Product } from "./types.ts";
import { computeBadges } from "./productBadges.ts";
import { splitByMatch } from "./highlight.ts";

type ProductCardProps = {
  product: Product;
  /** 하이라이트에 쓰는 검색어 — debounce된 값을 페이지에서 내려받는다 */
  highlightQuery: string;
  isWished: boolean;
  onToggleWishlist: (productId: number) => void;
  onClick: (productId: number) => void;
};

const formatPrice = (won: number) => won.toLocaleString() + "원";

export function ProductCard({
  product,
  highlightQuery,
  isWished,
  onToggleWishlist,
  onClick,
}: ProductCardProps) {
  const { discountRate, isNew, isHot, isBest, isSoldOut, isAlmostSoldOut, isFreeShipping } =
    computeBadges(product, new Date());

  return (
    <article className="product-card" onClick={() => onClick(product.id)}>
      <div className="image-wrap">
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
        {discountRate > 0 && <span className="badge badge-discount">{discountRate}% 할인</span>}
        {isNew && <span className="badge badge-new">NEW</span>}
        {isHot && <span className="badge badge-hot">특가</span>}
        {isBest && <span className="badge badge-best">BEST</span>}
        {isSoldOut && <span className="badge badge-soldout">품절</span>}
        {!isSoldOut && isAlmostSoldOut && <span className="badge badge-warning">품절 임박</span>}
      </div>

      <div className="card-body">
        <h3 className="product-name">
          {splitByMatch(product.name, highlightQuery).map((segment, i) =>
            segment.isMatch ? (
              <mark key={i} style={{ background: "#fff176", padding: 0 }}>
                {segment.text}
              </mark>
            ) : (
              segment.text
            ),
          )}
        </h3>
        <div className="price-area">
          {product.originalPrice && (
            <span className="original-price">{formatPrice(product.originalPrice)}</span>
          )}
          <span className="price">{formatPrice(product.price)}</span>
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
          <span className="review-count">({product.reviewCount.toLocaleString()})</span>
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
              onToggleWishlist(product.id);
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
