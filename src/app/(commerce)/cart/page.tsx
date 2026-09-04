import { CartList } from "@/features/cart/ui/CartList";
import { ClearCartButton } from "@/features/clear-cart/ui/ClearCartButton";
import focused from "@/shared/ui/focused-page.module.css";

import styles from "./page.module.css";

// 공개 경로(proxy 매처 밖). 익명도 담은 상품을 확인할 수 있다.
// cart·clear-cart 두 feature의 합성은 상위 레이어인 이 페이지가 한다(feature끼리 직접 의존 금지).
export default function CartPage() {
  return (
    <section className={focused.page}>
      <h1>장바구니</h1>
      <CartList toolbar={<ClearCartButton className={styles.clear} />} />
    </section>
  );
}
