import type { Product } from '../types/product';
import {
  getDiscountRate,
  isSoldOut,
  isAlmostSoldOut,
  isHot,
  isBest,
  isNew,
  isFreeShipping,
} from '../utils/product';
import { formatPrice, escapeRegExp } from '../utils/format';

type Props = {
  product: Product;
  searchQuery: string;
  isWished: boolean;
  onToggleWishlist: (id: number) => void;
  onClick: (id: number) => void;
};

function highlight(text: string, query: string) {
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} style={{ background: '#fff176', padding: 0 }}>
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function ProductCard({
  product,
  searchQuery,
  isWished,
  onToggleWishlist,
  onClick,
}: Props) {
  const discountRate = getDiscountRate(product);
  const soldOut = isSoldOut(product);

  return (
    <article className="product-card" onClick={() => onClick(product.id)}>
      <div className="image-wrap">
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
        {discountRate > 0 && (
          <span className="badge badge-discount">{discountRate}% 할인</span>
        )}
        {isNew(product) && <span className="badge badge-new">NEW</span>}
        {isHot(product) && <span className="badge badge-hot">특가</span>}
        {isBest(product) && <span className="badge badge-best">BEST</span>}
        {soldOut && <span className="badge badge-soldout">품절</span>}
        {!soldOut && isAlmostSoldOut(product) && (
          <span className="badge badge-warning">품절 임박</span>
        )}
      </div>

      <div className="card-body">
        <h3 className="product-name">{highlight(product.name, searchQuery)}</h3>
        <div className="price-area">
          {product.originalPrice && (
            <span className="original-price">
              {formatPrice(product.originalPrice)}
            </span>
          )}
          <span className="price">{formatPrice(product.price)}</span>
          {isFreeShipping(product) && (
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
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            aria-label="위시리스트 토글"
          >
            {isWished ? '♥' : '♡'}
          </button>
        </div>
      </div>
    </article>
  );
}
