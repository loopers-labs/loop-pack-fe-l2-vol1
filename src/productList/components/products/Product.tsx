import type { Product as ProductType } from '../../shared';
import { getProductPricing, getProductStockStatus, getProductBadges } from '../../utils/product';
import { HighlightMatch } from './HighlightMatch';

export const Product = ({
  product,
  searchQuery,
  isWished,
  onProductClick,
  onWishlistToggle,
}: {
  product: ProductType;
  searchQuery: string;
  isWished: boolean;
  onProductClick: (productId: number) => void;
  onWishlistToggle: (productId: number) => void;
}) => {
  // AI: 커스텀 훅 분리 기준
  const { discountRate, formattedPrice, formattedOriginal } = getProductPricing(product);
  const { isAlmostSoldOut, isSoldOut } = getProductStockStatus(product);
  const { isHot, isBest, isFreeShipping, isNew } = getProductBadges(discountRate, product);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onWishlistToggle(product.id);
  };

  return (
    <article key={product.id} className="product-card" onClick={() => onProductClick(product.id)}>
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
          <HighlightMatch text={product.name} searchQuery={searchQuery} />
        </h3>
        <div className="price-area">
          {formattedOriginal && <span className="original-price">{formattedOriginal}</span>}
          <span className="price">{formattedPrice}</span>
          {isFreeShipping && (
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
          <span className="review-count">({product.reviewCount.toLocaleString()})</span>
          <button
            style={{
              marginLeft: 'auto',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 16,
            }}
            onClick={handleWishlistToggle}
            aria-label="위시리스트 토글"
          >
            {isWished ? '♥' : '♡'}
          </button>
        </div>
      </div>
    </article>
  );
};
