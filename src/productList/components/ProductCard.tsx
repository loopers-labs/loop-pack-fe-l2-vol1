import type { Product } from '../type';

const ALMOST_SOLD_OUT_THRESHOLD = 5;
const HOT_DISCOUNT_THRESHOLD = 30;
const BEST_RATING_THRESHOLD = 4.5;
const BEST_REVIEW_THRESHOLD = 100;
const FREE_SHIPPING_THRESHOLD = 50000;
const MS_PER_DAY = 86400000;
const PERCENT = 100;
const NEW_PRODUCT_DAYS = 7;

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

type Props = {
  product: Product;
  searchQuery: string;
  isWished: boolean;
  onWishlistToggle: (id: number) => void;
  onClick: (id: number) => void;
};

export function ProductCard({
  product,
  searchQuery,
  isWished,
  onWishlistToggle,
  onClick,
}: Props) {
  const highlightMatch = (text: string) => {
    if (!searchQuery) return <>{text}</>;
    const parts = text.split(
      new RegExp(`(${escapeRegExp(searchQuery)})`, 'gi'),
    );
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <mark key={i} style={{ background: '#fff176', padding: 0 }}>
              {part}
            </mark>
          ) : (
            part
          ),
        )}
      </>
    );
  };

  const discountRate = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * PERCENT)
    : 0;
  const formattedPrice = `${product.price.toLocaleString()}원`;
  const formattedOriginal = product.originalPrice
    ? `${product.originalPrice.toLocaleString()}원`
    : null;
  const isAlmostSoldOut =
    product.stock > 0 && product.stock <= ALMOST_SOLD_OUT_THRESHOLD;
  const isSoldOut = product.stock === 0;
  const isHot = discountRate >= HOT_DISCOUNT_THRESHOLD;
  const isBest =
    product.rating >= BEST_RATING_THRESHOLD &&
    product.reviewCount >= BEST_REVIEW_THRESHOLD;
  const isFreeShipping = product.price >= FREE_SHIPPING_THRESHOLD;

  const createdDate = new Date(product.createdAt);
  const now = new Date();
  const daysSinceCreated = Math.floor(
    (now.getTime() - createdDate.getTime()) / MS_PER_DAY,
  );
  const isNew = daysSinceCreated <= NEW_PRODUCT_DAYS;

  return (
    <article className="product-card" onClick={() => onClick(product.id)}>
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
        <h3 className="product-name">{highlightMatch(product.name)}</h3>
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
}
