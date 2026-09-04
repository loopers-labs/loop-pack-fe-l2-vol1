import { OrderForm } from "@/features/orders/ui/OrderForm";
import styles from "@/shared/ui/focused-page.module.css";

// 보호 경로(proxy 매처). 익명 장바구니로 담은 뒤 주문하려면 여기서 로그인 게이트를 지난다.
export default function OrderFormPage() {
  return (
    <section className={styles.page}>
      <h1>주문서</h1>
      <OrderForm />
    </section>
  );
}
