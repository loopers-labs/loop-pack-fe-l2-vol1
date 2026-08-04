import { getCatalog } from "./_lib/get-catalog";

import { ProductOptions } from "./_components/product-options";

export default function SelectDemoPage() {
  const catalog = getCatalog();

  return (
    <main
      style={{
        maxWidth: 560,
        margin: "0 auto",
        padding: "48px 24px",
        display: "grid",
        gap: 24,
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Select — 로직 1벌, 생김새 3종</h1>
      <ProductOptions catalog={catalog} />
    </main>
  );
}
