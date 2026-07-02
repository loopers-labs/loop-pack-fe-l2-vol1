import type { Product } from "../types";
import { formatPrice, getProductBadges } from "../utils";
import HighlightedText from "./HighlightedText";
import ProductBadges from "./ProductBadges";

/** 상품 한 건을 카드로 렌더한다. 클릭 시 상세 보기, 하트 버튼으로 위시리스트 토글. */
export default function ProductCard({
  product,
  searchQuery,
  isWished,
  onToggleWishlist,
  onClick,
}: {
  product: Product;
  searchQuery: string;
  isWished: boolean;
  onToggleWishlist: (productId: number) => void;
  onClick: (productId: number) => void;
}) {
  const badges = getProductBadges(product);

  return (
    <article className="product-card" onClick={() => onClick(product.id)}>
      <div className="image-wrap">
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
        <ProductBadges badges={badges} />
      </div>

      <div className="card-body">
        <h3 className="product-name">
          <HighlightedText text={product.name} query={searchQuery} />
        </h3>
        <div className="price-area">
          {product.originalPrice && (
            <span className="original-price">
              {formatPrice(product.originalPrice)}
            </span>
          )}
          <span className="price">{formatPrice(product.price)}</span>
          {badges.isFreeShipping && (
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
