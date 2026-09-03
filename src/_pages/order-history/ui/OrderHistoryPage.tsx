'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { ordersQueries } from '@/entities/order/api/ordersQueries';
import { useCartStore } from '@/entities/cart/model/cartStore';

export function OrderHistoryPage() {
  const { data: orders, isLoading, isError } = useQuery(ordersQueries.list());
  const itemDetails = useCartStore((state) => state.itemDetails);

  return (
    <section className="week05-section week09-order-page">
      <h1>주문내역</h1>

      {isLoading && <p>불러오는 중...</p>}
      {isError && (
        <p className="week05-error">주문 내역을 불러오지 못했습니다.</p>
      )}
      {orders && orders.length === 0 && <p>주문 내역이 없습니다.</p>}

      {orders && orders.length > 0 && (
        // 이 페이지에서만 쓰는 레이아웃이라 전역 CSS 대신 인라인 스타일로 처리
        <div style={{ border: '1px solid #c8c8c8', padding: 16 }}>
          <ul className="week09-order-list">
            {orders.map((order) => {
              const [firstItem, ...restItems] = order.items;
              // 주문 API 응답엔 productId·수량만 있고 이름·이미지가 없어,
              // 담을 때 cartStore에 저장해둔 상세정보(itemDetails)를 재사용한다.
              // 이 앱을 통해 주문한 상품은 반드시 한 번은 담긴 적이 있어 대부분
              // 찾아지지만, 다른 기기·데이터 삭제 등으로 없을 수도 있어 방어함.
              const details = itemDetails[firstItem.productId];
              const label = details
                ? details.name
                : `${firstItem.productId} (상품 정보 없음)`;

              return (
                <li key={order.id} className="week09-order-item">
                  {details ? (
                    <Image
                      src={details.image}
                      alt={details.name}
                      width={96}
                      height={96}
                    />
                  ) : (
                    <div
                      style={{ width: 96, height: 96, background: '#ececec' }}
                    />
                  )}
                  <div className="week09-order-item-info">
                    <p>{new Date(order.createdAt).toLocaleString('ko-KR')}</p>
                    <h3>
                      {label}
                      {restItems.length > 0 && ` 외 ${restItems.length}개`}
                    </h3>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
