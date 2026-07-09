// Select 사용처 예시 — 같은 Select shell/로직에 renderOption만 갈아끼워 3종을 그린다.
// 서버 컴포넌트(page)는 함수를 클라이언트로 못 넘기므로, renderOption을 넘기는 이쪽이 "use client".
"use client";
import Image from "next/image";
import { Select } from "./index";

type ProductSize = { value: number; stock: number };
type Product = {
  id: string;
  name: string;
  price: number;
  originalPrice: number | null;
  image: string;
  freeShipping: boolean;
  sizes: ProductSize[];
};

export function SelectExample({ products }: { products: Product[] }) {
  // 상품 → 옵션. sizes가 전부 품절(빈 배열 포함)이면 상품 자체가 품절.
  // 텍스트/썸네일 두 생김새가 "같은 옵션 데이터"를 공유한다.
  const productOptions = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    image: p.image,
    disabled: p.sizes.every((s) => s.stock === 0),
  }));

  // 사이즈 옵션은 "상품 하나의 sizes"를 옵션 객체로 변환(경계에서 transform).
  // 재고 0인 사이즈만 개별 품절 → 같은 useSelect가 그대로 스킵/차단한다.
  const first = products[0];
  const sizeOptions = first
    ? first.sizes.map((s) => ({
        id: `${first.id}-${s.value}`,
        name: `${s.value}`,
        disabled: s.stock === 0,
        stock: s.stock,
      }))
    : [];

  return (
    <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" }}>
      {/* 1) 텍스트 — 이름만. state.selected를 사용처가 직접 써서 체크 표시(상태 노출 검증). */}
      <section>
        <h3>텍스트</h3>
        <Select
          options={productOptions}
          placeholder="상품 선택"
          renderOption={(item, state) => (
            <span style={{ fontWeight: state.selected ? 700 : 400 }}>
              {state.selected ? "✓ " : ""}
              {item.name}
              {item.disabled ? " (품절)" : ""}
            </span>
          )}
        />
      </section>

      {/* 2) 썸네일 — 이미지 + 이름 + 가격 (같은 productOptions, 생김새만 다름) */}
      <section>
        <h3>썸네일</h3>
        <Select
          options={productOptions}
          placeholder="상품 선택"
          renderOption={(item) => (
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Image src={item.image} alt="" width={24} height={24} unoptimized />
              <span>{item.name}</span>
              <span style={{ color: "#888" }}>{item.price.toLocaleString()}원</span>
              {item.disabled ? <span style={{ color: "#c00" }}>품절</span> : null}
            </span>
          )}
        />
      </section>

      {/* 3) 사이즈 — 사이즈 값. 재고 0(25·28)은 품절 → 키보드 이동에서 스킵된다. */}
      <section>
        <h3>사이즈</h3>
        <Select
          options={sizeOptions}
          placeholder="사이즈 선택"
          renderOption={(item) => `${item.name}${item.disabled ? " (품절)" : ""}`}
        />
      </section>
    </div>
  );
}
