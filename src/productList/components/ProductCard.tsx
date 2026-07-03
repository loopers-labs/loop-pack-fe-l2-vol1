import type { ReactNode } from 'react';

import { formatNumber } from '../utils';
import type { ProductCardModel } from '../utils/productCard';

import { HighlightText } from './HighlightText';

type ProductCardProps = {
  product: ProductCardModel;
  nameHighlightWord?: string;
  onSelect: () => void;
  trailingAction?: ReactNode;
};

export function ProductCard({
  product,
  nameHighlightWord = '',
  onSelect,
  trailingAction,
}: ProductCardProps) {
  const {
    discountRate,
    formattedPrice,
    formattedOriginal,
    isSoldOut,
    isAlmostSoldOut,
    isHot,
    isBest,
    isFreeShipping,
    isNew,
  } = product;

  return (
    <article className="product-card" onClick={onSelect}>
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
          <HighlightText
            text={product.name}
            highlightWord={nameHighlightWord}
          />
        </h3>
        <div className="price-area">
          {formattedOriginal && (
            <span className="original-price">{formattedOriginal}</span>
          )}
          <span className="price">{formattedPrice}</span>
          {isFreeShipping && <span className="free-shipping">무료배송</span>}
        </div>
        <div className="rating-area">
          <span className="rating">★ {product.rating.toFixed(1)}</span>
          <span className="review-count">
            ({formatNumber(product.reviewCount)})
          </span>
          {trailingAction}
        </div>
      </div>
    </article>
  );
}
