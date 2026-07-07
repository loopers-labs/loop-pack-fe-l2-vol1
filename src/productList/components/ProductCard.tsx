// [AI 생성] 3주차 관심사 분리 — 상품 카드 (UI 렌더 전용, 검토·수정)
import type { Product } from "../types";
import { deriveProductBadges } from "../utils/productBadges";
import { formatPrice } from "../utils/formatters";
import { Highlight } from "./Highlight";

type ProductCardProps = {
  product: Product;
  searchQuery: string;
  isWished: boolean;
  onSelect: (productId: number) => void;
  onToggleWish: (productId: number) => void;
};

export function ProductCard({
  product,
  searchQuery,
  isWished,
  onSelect,
  onToggleWish,
}: ProductCardProps) {
  const badges = deriveProductBadges(product);
  const originalPrice = product.originalPrice ? formatPrice(product.originalPrice) : null;

  return (
    <article className="product-card" onClick={() => onSelect(product.id)}>
      <div className="image-wrap">
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
        {badges.discountRate > 0 && (
          <span className="badge badge-discount">{badges.discountRate}% 할인</span>
        )}
        {badges.isNew && <span className="badge badge-new">NEW</span>}
        {badges.isHot && <span className="badge badge-hot">특가</span>}
        {badges.isBest && <span className="badge badge-best">BEST</span>}
        {badges.isSoldOut && <span className="badge badge-soldout">품절</span>}
        {badges.isAlmostSoldOut && <span className="badge badge-warning">품절 임박</span>}
      </div>

      <div className="card-body">
        <h3 className="product-name">
          <Highlight text={product.name} query={searchQuery} />
        </h3>
        <div className="price-area">
          {originalPrice && <span className="original-price">{originalPrice}</span>}
          <span className="price">{formatPrice(product.price)}</span>
          {badges.isFreeShipping && (
            <span style={{ marginLeft: 6, fontSize: 11, color: "#2e7d32", fontWeight: 600 }}>
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
              onToggleWish(product.id);
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
