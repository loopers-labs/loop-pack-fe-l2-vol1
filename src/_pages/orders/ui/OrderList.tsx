'use client'

import Image from 'next/image'
import { useOrderListQuery } from '@/entities/order'
import { useProductListQuery, type ProductSummary } from '@/entities/product'
import styles from './orders.module.css'
import { OrderListSkeleton } from './OrderListSkeleton'

export const OrderList = () => {
  const orderListQuery = useOrderListQuery()
  // 주문 API는 productId와 수량만 돌려준다. 단건 상품 API가 없어 p1~p30을 포함하는
  // 목록 3페이지를 병렬로 읽고, 이 페이지에서 화면용 상품 정보와 결합한다.
  const firstProductPageQuery = useProductListQuery({ page: 1 })
  const secondProductPageQuery = useProductListQuery({ page: 2 })
  const thirdProductPageQuery = useProductListQuery({ page: 3 })
  const productPageQueries = [firstProductPageQuery, secondProductPageQuery, thirdProductPageQuery]
  // 빈 배열이 캐시에 있으면 재조회 중에도 isPending은 false다. 이때 바로 빈 상태를 그리면
  // 주문 직후 최신 목록이 도착하기 전까지 "주문 내역이 없습니다"가 잠깐 노출된다.
  const isOrderListResolving =
    orderListQuery.isPending ||
    (orderListQuery.isFetching && orderListQuery.data?.orders.length === 0)
  const isPending = isOrderListResolving || productPageQueries.some((query) => query.isPending)
  const error =
    orderListQuery.error ?? productPageQueries.find((query) => query.error)?.error ?? null

  if (isPending) {
    return <OrderListSkeleton />
  }

  if (error !== null) {
    return <p role="alert">{error.message}</p>
  }

  const products = productPageQueries.flatMap((query) => query.data?.products ?? [])
  const productById = new Map<string, ProductSummary>(
    products.map((product) => [product.id, product]),
  )
  const { data } = orderListQuery

  if (data === undefined) {
    return null
  }

  // 새 계정으로 처음 들어오면 이 화면을 먼저 본다.
  if (data.orders.length === 0) {
    return <p className="layout-empty">주문 내역이 없습니다.</p>
  }

  return (
    <ul className={styles.list}>
      {data.orders.map((order) => (
        <li key={order.id} className={styles.order}>
          <p className={styles.meta}>
            <span>
              <strong>주문번호 {order.id}</strong>
              <time dateTime={order.createdAt}>
                {new Date(order.createdAt).toLocaleString('ko-KR')}
              </time>
            </span>
            <strong>{order.items.length}건</strong>
          </p>
          <ul className={styles.items}>
            {order.items.map((item) => (
              <OrderProductItem
                key={item.productId}
                product={productById.get(item.productId)}
                productId={item.productId}
                quantity={item.quantity}
              />
            ))}
          </ul>
        </li>
      ))}
    </ul>
  )
}

type OrderProductItemProps = {
  product: ProductSummary | undefined
  productId: string
  quantity: number
}

const OrderProductItem = ({ product, productId, quantity }: OrderProductItemProps) => (
  <li>
    {product === undefined ? (
      <span className={styles.thumbnail} aria-hidden="true" />
    ) : (
      <Image
        className={styles.thumbnail}
        src={product.image}
        alt={product.name}
        width={64}
        height={64}
      />
    )}
    <span className={styles.productInfo}>
      {product !== undefined && <small>{product.brand}</small>}
      <strong>{product?.name ?? productId}</strong>
    </span>
    <strong>× {quantity}</strong>
  </li>
)
