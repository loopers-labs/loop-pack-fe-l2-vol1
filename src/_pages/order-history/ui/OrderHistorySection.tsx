'use client';

import Link from 'next/link';
import { useSuspenseQueries } from '@tanstack/react-query';
import { formatPrice } from '@/shared/lib/formatPrice';
import { orderQueries } from '@/entities/order';
import { productCatalogQueries } from '@/entities/product';
import { OrderLine } from '@/widgets/order-line';
import type { Order } from '@/entities/order';
import type { Product } from '@/entities/product';

// 서버와 브라우저의 기본 시간대가 달라도 같은 문자열이 나오도록 시간대를 고정한다.
const orderDateFormat = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' });

interface OrderCardProps {
  order: Order;
  catalog: Record<string, Product>;
}

function OrderCard({ order, catalog }: OrderCardProps) {
  const lines = order.items.map((item) => ({ item, product: catalog[item.productId] }));

  const totalQuantity = lines.reduce((sum, line) => sum + line.item.quantity, 0);
  // 상품 정보를 못 찾은 항목은 금액을 알 수 없다. 합계에서 빼고, 뺐다는 사실을 문구로 밝힌다.
  // 지어낸 0원을 더해 틀린 합계를 맞는 것처럼 보여주지 않는다.
  const totalPrice = lines.reduce((sum, { item, product }) => sum + (product ? product.price * item.quantity : 0), 0);
  const hasUnknownProduct = lines.some(({ product }) => !product);

  return (
    <article className="order-card">
      <h2 className="order-card-head">
        <time dateTime={order.createdAt}>{orderDateFormat.format(new Date(order.createdAt))}</time>
        {/* 가운뎃점은 시각적 구분자라 읽히지 않게 감춘다. 그러면 날짜와 주문번호가 붙어 읽히므로
            음성으로 끊어 읽을 쉼표를 따로 둔다. */}
        <span aria-hidden="true"> · </span>
        <span className="visually-hidden">, </span>
        <span>주문번호 {order.id}</span>
      </h2>

      <ul className="order-line-list">
        {lines.map(({ item, product }) => (
          <OrderLine key={item.productId} productId={item.productId} product={product} quantity={item.quantity} />
        ))}
      </ul>

      <p className="order-card-foot">
        <span>상품 {totalQuantity}개</span>
        <strong>
          <span className="visually-hidden">주문 합계 </span>
          {formatPrice(totalPrice)}
          {hasUnknownProduct && <span className="order-card-note"> (상품 정보를 불러오지 못한 항목 제외)</span>}
        </strong>
      </p>
    </article>
  );
}

export default function OrderHistorySection() {
  // 두 요청을 나란히 보낸다. 순서대로 부르면 주문을 받은 뒤에야 카탈로그를 받기 시작한다.
  const [{ data: orders }, { data: catalog }] = useSuspenseQueries({
    queries: [orderQueries.list(), productCatalogQueries.lookup()]
  });

  if (orders.length === 0) {
    return (
      <div className="empty-state">
        <p>아직 주문한 상품이 없습니다.</p>
        <Link className="empty-state-action" href="/products">
          상품 보러 가기
        </Link>
      </div>
    );
  }

  // API는 정렬을 보장하지 않고 addOrder가 배열 끝에 붙이기만 한다. 최근 주문을 먼저 보여준다.
  const latestFirst = [...orders].reverse();

  return (
    <ul className="order-card-list">
      {latestFirst.map((order) => (
        <li key={order.id}>
          <OrderCard order={order} catalog={catalog} />
        </li>
      ))}
    </ul>
  );
}
