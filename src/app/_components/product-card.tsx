import { CartButton, WishlistButton } from "@/app/_components/product-actions";
import type { Product } from "@/types/commerce";
import Image from "next/image";

type ProductCardProps = {
  product: Product;
  titleAs?: "h2" | "h3";
};

export function ProductCard({ product, titleAs = "h3" }: ProductCardProps) {
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
      <div>
        <WishlistButton productId={product.id} label={product.name} />
        <CartButton productId={product.id} label={product.name} />
      </div>
    </article>
  );
}
