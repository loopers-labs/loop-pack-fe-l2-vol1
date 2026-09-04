'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';

import styles from './OrdersPage.module.css';

import { orderQueries } from '@/entities/order';
import { productQueries } from '@/entities/product';
import { useSessionUser } from '@/entities/session';

export function OrdersPage() {
  return (
    <section className="week05-section" aria-labelledby="orders-title">
      <h1 id="orders-title">주문 내역</h1>
      <OrdersContent />
    </section>
  );
}

function OrdersContent() {
  const user = useSessionUser();
  const {
    data: orderList,
    isPending,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    ...orderQueries.list(user?.id ?? ''),
    // 만료로 사용자가 비워진 뒤에는 에러 경계가 로그인으로 보내므로 조회를 시작하지 않는다
    enabled: Boolean(user),
  });
  const {
    data: catalogProducts,
    isPending: isCatalogPending,
    isError: isCatalogError,
    refetch: refetchCatalog,
  } = useQuery({
    ...productQueries.catalog(),
    enabled: Boolean(orderList?.orders.length),
  });

  const hasOrders = Boolean(orderList?.orders.length);

  // 상품명 없이 ID만 잠깐 노출되지 않게 catalog까지 기다린다. 실패는 아래에서 안내한다.
  if (
    !user ||
    isPending ||
    (isFetching && !hasOrders) ||
    (hasOrders && isCatalogPending && !isCatalogError)
  ) {
    return <p className={styles.statusText}>주문 내역을 불러오는 중</p>;
  }

  if (isError) {
    return (
      <p role="alert">
        주문 내역을 불러오지 못했습니다.
        <button
          type="button"
          onClick={() => {
            void refetch();
          }}
        >
          다시 시도
        </button>
      </p>
    );
  }

  if (orderList.orders.length === 0) {
    return (
      <>
        <p>주문 내역이 없습니다.</p>
        <Link href="/products">상품 보러 가기</Link>
      </>
    );
  }

  const productById = new Map(
    (catalogProducts ?? []).map((product) => [product.id, product]),
  );

  return (
    <>
      {isCatalogError && (
        <p role="alert">
          상품 정보를 불러오지 못했습니다.
          <button
            type="button"
            onClick={() => {
              void refetchCatalog();
            }}
          >
            다시 시도
          </button>
        </p>
      )}
      <ul className={styles.list}>
        {orderList.orders.map((order) => (
          <li
            key={order.id}
            className={styles.order}
            aria-label={`주문 ${order.id}`}
          >
            <div className={styles.orderHeader}>
              <time className={styles.orderedAt} dateTime={order.createdAt}>
                {formatOrderedAt(order.createdAt)}
              </time>
              <span className={styles.orderId}>주문 {order.id}</span>
            </div>
            {/* 주문 응답에 결제 금액이 없고 catalog는 현재 가격이라, 주문 당시 금액처럼 보이지 않게 가격은 표시하지 않는다 */}
            <ul className={styles.items}>
              {order.items.map((item) => {
                const product = productById.get(item.productId);

                return (
                  <li key={item.productId} className={styles.item}>
                    {product && (
                      <Image
                        className={styles.thumbnail}
                        src={product.image}
                        alt=""
                        width={64}
                        height={64}
                      />
                    )}
                    <span className={styles.itemInfo}>
                      {product && (
                        <span className={styles.brand}>{product.brand}</span>
                      )}
                      <span className={styles.itemName}>
                        {product?.name ?? item.productId}
                      </span>
                      <span className={styles.quantity}>{item.quantity}개</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </>
  );
}

const formatOrderedAt = (createdAt: string) =>
  new Date(createdAt).toLocaleString('ko-KR', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
