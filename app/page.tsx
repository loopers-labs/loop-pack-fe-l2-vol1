import type { CSSProperties } from "react";
import { getProducts, ProductOptions, PurchaseDialog } from "@/products";

export const dynamic = "force-dynamic";

const mainStyle: CSSProperties = {
  maxWidth: 720,
  margin: "0 auto",
  padding: "64px 24px",
  display: "flex",
  flexDirection: "column",
  gap: 40,
};

const titleStyle: CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  color: "#141a2b",
};

const listStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 24,
};

const cardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  padding: 20,
  border: "1px solid #e4e7ec",
  borderRadius: 16,
  background: "#ffffff",
};

const productNameStyle: CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
  color: "#141a2b",
};

const dialogSectionStyle: CSSProperties = {
  paddingTop: 24,
  borderTop: "1px solid #e4e7ec",
};

export default async function Home() {
  const products = await getProducts();

  return (
    <main style={mainStyle}>
      <h1 style={titleStyle}>Commerce</h1>
      <section aria-label="상품 목록" style={listStyle}>
        {products.map((product) => (
          <article key={product.id} style={cardStyle}>
            <h2 style={productNameStyle}>{product.name}</h2>
            <ProductOptions product={product} />
          </article>
        ))}
      </section>
      <section aria-label="구매" style={dialogSectionStyle}>
        <PurchaseDialog productName={products[0]?.name ?? "상품"} priceLabel="구매 요약" />
      </section>
    </main>
  );
}
