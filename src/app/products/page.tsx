import { SiteHeader } from "@/components/commerce/SiteHeader";
import { ProductListContainer } from "@/features/products/ProductListContainer";

export default function ProductsPage() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-6 pb-16">
      <SiteHeader wishlistCount={0} cartCount={0} />
      <ProductListContainer />
    </main>
  );
}
