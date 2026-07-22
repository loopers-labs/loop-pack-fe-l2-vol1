"use client";

import { getHome } from "@/services/commerce";
import type { Product } from "@/types/commerce";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";

/**
 * 5주차 과제를 빠르게 시작할 수 있도록 제공하는 최소 레이아웃 예시입니다.
 * 이 구조는 상태관리 아키텍처의 정답이 아닙니다.
 * 그대로 사용하거나, 기존 컴포넌트를 재사용하거나, 자유롭게 교체해도 됩니다.
 * 데이터 조회, Query 구성, 전역 상태와 이벤트 연결은 포함되어 있지 않습니다.
 * 실제 상태를 연결할 때 각 버튼의 aria-pressed를 해당 상품의 포함 여부로 바꿉니다.
 */
export default function HomePage() {
  const { data: home, isLoading } = useQuery({
    queryKey: ["home"],
    queryFn: getHome,
  });

  if (home === undefined || isLoading) {
    return <div></div>;
  }

  const sections: Array<{ title: string; products: Product[] }> = [
    { title: "인기 상품", products: home.popularProducts },
    { title: "신상품", products: home.newProducts },
  ];

  return (
    <>
      <section className="week05-hero">
        <p>{home.banner.description}</p>
        <h1>{home.banner.title}</h1>
      </section>
      <section className="week05-section">
        <h2>카테고리</h2>
        <div className="week05-categories">
          {home.categories.map((category) => (
            <Link key={category.id} href={`/products?category=${category.id}`}>
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      {sections.map(({ title, products }) => (
        <section className="week05-section" key={title}>
          <h2>{title}</h2>
          <div className="week05-grid">
            {products.map((product) => (
              <article className="week05-product" key={product.id}>
                <Image
                  className="week05-image"
                  src={product.image}
                  alt={product.name}
                  width={400}
                  height={400}
                />
                <p>{product.brand}</p>
                <h3>{product.name}</h3>
                <strong>{product.price.toLocaleString()}원</strong>
                <div>
                  <button
                    type="button"
                    aria-label={`${product.name} 위시리스트`}
                    aria-pressed={false}
                  >
                    찜
                  </button>
                  <button
                    type="button"
                    aria-label={`${product.name} 장바구니`}
                    aria-pressed={false}
                  >
                    담기
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
