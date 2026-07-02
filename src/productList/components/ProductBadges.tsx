import type { ProductBadges as Badges } from "../types";

/** 상품 카드 이미지 위에 표시하는 배지(할인·신상·특가·BEST·품절 등)를 그린다. */
export default function ProductBadges({ badges }: { badges: Badges }) {
  const { discountRate, isNew, isHotDeal, isBest, isSoldOut, isAlmostSoldOut } =
    badges;

  return (
    <>
      {discountRate > 0 && (
        <span className="badge badge-discount">{discountRate}% 할인</span>
      )}
      {isNew && <span className="badge badge-new">NEW</span>}
      {isHotDeal && <span className="badge badge-hot">특가</span>}
      {isBest && <span className="badge badge-best">BEST</span>}
      {isSoldOut && <span className="badge badge-soldout">품절</span>}
      {!isSoldOut && isAlmostSoldOut && (
        <span className="badge badge-warning">품절 임박</span>
      )}
    </>
  );
}
