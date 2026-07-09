import type { Product } from '../types';
import { formatPrice } from '../utils/formatPrice';
import { getProductBadges } from '../utils/getProductBadges';
import { isFreeShipping } from '../utils/isFreeShipping';
import HighlightText from './HighlightText';

interface ProductCardProps {
  product: Product;
  searchQuery: string;
  isWished: boolean;
  onClick: (productId: number) => void;
  onWishlistToggle: (productId: number) => void;
}

/**
 * 상품 카드 한 장을 렌더링하는 컴포넌트
 * - 분리 기준: 분리 전에는 그리드 map 안에 하이라이팅 함수, 뱃지 도메인 규칙, 가격 포맷이 전부 인라인으로
 *   들어있어 목록과 카드 한 장의 책임이 한 덩어리였습니다. 카드는 렌더링만 담당하고,
 *   계산 로직(뱃지/무료배송/포맷)은 순수함수를 호출하여 결과만 그리도록 분리하였습니다.
 */
const ProductCard = ({ product, searchQuery, isWished, onClick, onWishlistToggle }: ProductCardProps) => {
  return (
    <article className="product-card" onClick={() => onClick(product.id)}>
      <div className="image-wrap">
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
        {getProductBadges(product).map((badge) => (
          <span key={badge.type} className={`badge badge-${badge.type}`}>
            {badge.label}
          </span>
        ))}
      </div>

      <div className="card-body">
        <h3 className="product-name">
          <HighlightText text={product.name} query={searchQuery} />
        </h3>
        <div className="price-area">
          {product.originalPrice && <span className="original-price">{formatPrice(product.originalPrice)}</span>}
          <span className="price">{formatPrice(product.price)}</span>
          {isFreeShipping(product.price) && (
            <span style={{ marginLeft: 6, fontSize: 11, color: '#2e7d32', fontWeight: 600 }}>무료배송</span>
          )}
        </div>
        <div className="rating-area">
          <span className="rating">★ {product.rating.toFixed(1)}</span>
          <span className="review-count">({product.reviewCount.toLocaleString()})</span>
          <button
            style={{ marginLeft: 'auto', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}
            onClick={(e) => {
              e.stopPropagation();
              onWishlistToggle(product.id);
            }}
            aria-label="위시리스트 토글"
          >
            {isWished ? '♥' : '♡'}
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
