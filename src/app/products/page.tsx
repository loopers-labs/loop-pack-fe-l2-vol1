import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/commerce/SiteHeader";
import { ProductListContainer } from "@/features/products/ProductListContainer";
import { getProductListRedirectPath } from "@/features/products/normalizeProductListSearchParams";
import type { SearchParams } from "nuqs/server";

type ProductsPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const redirectPath = getProductListRedirectPath(await searchParams);

  if (redirectPath !== null) {
    redirect(redirectPath);
  }

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-6 pb-16">
      <SiteHeader wishlistCount={0} cartCount={0} />
      <ProductListContainer />
    </main>
  );
}
