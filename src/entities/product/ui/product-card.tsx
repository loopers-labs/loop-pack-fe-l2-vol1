import Image from "next/image";
import { ReactNode } from "react";
import type { Product } from "@/types/commerce";

type ProductCardProps = {
  product: Product;
  titleAs?: "h2" | "h3";
  actions: ReactNode;
};

export function ProductCard({ product, titleAs = "h3", actions }: ProductCardProps) {
  const Title = titleAs;

  return (
    <article className="week05-product">
      <Image
        className="week05-image"
        src={product.image}
        alt={product.name}
        width={400}
        height={400}
      />
      <p>{product.brand}</p>
      <Title>{product.name}</Title>
      <strong>{product.price.toLocaleString()}원</strong>
      <div>{actions}</div>
    </article>
  );
}
