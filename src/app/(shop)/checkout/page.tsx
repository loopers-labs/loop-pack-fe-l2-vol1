import type { Metadata } from "next";
import { resolveCheckoutQuery } from "@/_pages/checkout/model/resolveCheckoutQuery";
import { SessionGate } from "@/features/auth";
import { CheckoutPage } from "@/_pages/checkout/ui/CheckoutPage";
import { products } from "@/app/api/_data/commerce";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = { title: "주문서" };

export default async function Page({ searchParams }: PageProps) {
  const query = resolveCheckoutQuery(await searchParams);
  const product = products.find((candidate) => candidate.id === query.productId) ?? null;
  return (
    <SessionGate>
      <CheckoutPage product={product} quantity={query.quantity} />
    </SessionGate>
  );
}
