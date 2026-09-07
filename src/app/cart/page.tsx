import { CommerceHeader } from "@/widgets/commerce";
import { CartSection } from "@/_pages/cart";
import app from "@/_app/styles/app.module.css";
import layout from "@/shared/ui/layout.module.css";

export default function CartPage() {
  return (
    <main className={app.page}>
      <CommerceHeader />
      <section className={layout.section}>
        <h1 className={layout.sectionTitle}>장바구니</h1>
        <CartSection />
      </section>
    </main>
  );
}
