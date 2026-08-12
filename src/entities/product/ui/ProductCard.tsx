import Image from 'next/image';
import type { ReactNode } from 'react';
import type { Product } from '@/entities/product/model/product';

type ProductCardProps = {
  /** 카드에 표시할 상품 데이터 */
  product: Product;
  /** 찜/담기 같은 행위 버튼 영역. entity는 어떤 행위가 오는지 모른다 */
  children?: ReactNode;
  /** 뷰포트 진입 전에도 즉시 보여야 하는 카드(그리드 첫 줄 등)면 true — 이미지 lazy loading을 건너뛴다 */
  isAboveFold?: boolean;
};

/* AI-generated : week06-fsd.md 3단계 기준 — 순수 상품 표현만 담당, 행위는 children으로 조합 */
/* AI-generated : Week 7 Part 1 Round 4 — 이미지가 그리드 열 수(5/3/2)에 따라 반응형으로 커지고 작아지는데 고정 width/height(400)를 쓰면 실제 렌더 폭보다 큰 srcset이 선택돼 과다 전송이 생김 — fill+sizes로 전환해 그리드 브레이크포인트에 맞는 폭만 받도록 함. isAboveFold가 아니면 next/image 기본값(loading="lazy")대로 뷰포트 진입 시점에만 다운로드된다 */
/* AI-generated : Week 7 Part 2 Round 10 — hero(LCP 요소, fetchPriority=high)를 내려받는 도중 첫 줄 카드 5장이
   끼어들어 대역폭을 나눠 쓰면서 hero 다운로드가 163KB에 2,460ms까지 늘어나는 것을 network-requests로 확인.
   카드 이미지는 LCP 요소가 아니므로 fetchPriority="low"로 낮춰, 브라우저가 hero를 먼저 끝내도록 한다 */
export function ProductCard({ product, children, isAboveFold = false }: ProductCardProps) {
  return (
    <article className="week05-product">
      <div className="week05-image-wrap">
        <Image
          className="week05-image"
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 720px) 50vw, (max-width: 960px) 33vw, 20vw"
          loading={isAboveFold ? 'eager' : 'lazy'}
          fetchPriority="low"
        />
      </div>
      <p>{product.brand}</p>
      <h3>{product.name}</h3>
      <strong>{product.price.toLocaleString()}원</strong>
      <div>{children}</div>
    </article>
  );
}
