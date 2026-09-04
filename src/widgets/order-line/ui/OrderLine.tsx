import Image from 'next/image';
import { formatPrice } from '@/shared/lib/formatPrice';
import type { Product } from '@/entities/product';

interface OrderLineProps {
  productId: string;
  product: Product | undefined;
  quantity: number;
}

/**
 * 확정된 주문 상품 한 줄. 주문 내역과 주문서가 같은 컴포넌트를 쓴다 —
 * 주문서는 결제 직전 품목을 읽기만 하므로 두 화면이 보여줄 것이 완전히 같다.
 * 수량을 바꾸는 화면(장바구니)은 컨트롤이 붙어야 해서 자기 마크업을 따로 쓴다.
 */
export default function OrderLine({ productId, product, quantity }: OrderLineProps) {
  // 상품 정보를 못 찾으면 금액을 알 수 없다. 지어낸 0원 대신 비워 두고 호출부가 합계에서 뺀다.
  const subtotal = product ? product.price * quantity : null;

  return (
    <li className="order-line">
      {product ? <Image className="order-line-image" src={product.image} alt={product.name} width={160} height={160} /> : <span className="order-line-image" aria-hidden="true" />}
      <div className="order-line-body">
        <p className="order-line-name">{product ? product.name : productId}</p>
        <p className="order-line-meta">
          {product && (
            <>
              <span className="visually-hidden">단가 </span>
              {formatPrice(product.price)}
              <span aria-hidden="true"> · </span>
            </>
          )}
          <span className="visually-hidden">수량 </span>
          {quantity}개
          {!product && (
            <>
              <span aria-hidden="true"> · </span>상품 정보 없음
            </>
          )}
        </p>
      </div>
      <strong className="order-line-subtotal">
        {subtotal === null ? (
          '—'
        ) : (
          <>
            <span className="visually-hidden">소계 </span>
            {formatPrice(subtotal)}
          </>
        )}
      </strong>
    </li>
  );
}
