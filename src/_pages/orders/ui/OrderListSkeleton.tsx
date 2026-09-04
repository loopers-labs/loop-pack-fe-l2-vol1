import styles from './orders.module.css'
import skeletonStyles from './OrderListSkeleton.module.css'

// 서버·라우트 loading 경계에서 바로 렌더할 수 있는 정적 스켈레톤이다. 클라이언트 쿼리
// 컴포넌트(OrderList)와 분리해 Next의 Suspense 정리 경계가 섞이지 않도록 한다.
export const OrderListSkeleton = () => (
  <div className={skeletonStyles.wrapper} role="status" aria-label="주문 내역을 불러오는 중">
    <span className="visually-hidden">주문 내역을 불러오는 중입니다.</span>
    <ul className={styles.list} aria-hidden="true">
      <li className={styles.order}>
        <div className={skeletonStyles.meta}>
          <span className={skeletonStyles.metaPrimary} />
          <span className={skeletonStyles.metaSecondary} />
        </div>
        <ul className={styles.items}>
          <SkeletonProductItem />
          <SkeletonProductItem />
        </ul>
      </li>
      <li className={styles.order}>
        <div className={skeletonStyles.meta}>
          <span className={skeletonStyles.metaPrimary} />
          <span className={skeletonStyles.metaSecondary} />
        </div>
        <ul className={styles.items}>
          <SkeletonProductItem />
        </ul>
      </li>
    </ul>
  </div>
)

const SkeletonProductItem = () => (
  <li className={skeletonStyles.product}>
    <span className={skeletonStyles.thumbnail} />
    <span className={skeletonStyles.productInfo}>
      <span className={skeletonStyles.brand} />
      <span className={skeletonStyles.productName} />
    </span>
    <span className={skeletonStyles.quantity} />
  </li>
)
