import { OrderHistory } from "@/features/orders/ui/OrderHistory";
import styles from "@/shared/ui/focused-page.module.css";

// 보호 경로(proxy 매처). 미로그인은 proxy가 로그인으로 돌리고, 렌더는 로그인 사용자만 도달한다.
export default function OrdersPage() {
  return (
    <section className={styles.page}>
      <h1>주문 내역</h1>
      <OrderHistory />
    </section>
  );
}
