import { CommerceHeader } from "@/widgets/commerce";
import { OrderListSection } from "@/_pages/orders";
import app from "@/_app/styles/app.module.css";
import layout from "@/shared/ui/layout.module.css";

export default function OrdersPage() {
  return (
    <main className={app.page}>
      <CommerceHeader />
      <section className={layout.section}>
        <h1 className={layout.sectionTitle}>주문 내역</h1>
        <OrderListSection />
      </section>
    </main>
  );
}
