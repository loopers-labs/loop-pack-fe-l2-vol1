import Image from "next/image";

export type ProductCardItem = {
  id: string;
  image: string;
  imageAlt: string;
  brand: string;
  name: string;
  priceText: string;
};

type ProductCardProps = {
  product: ProductCardItem;
  titleLevel?: 2 | 3;
  wishlistLabel: string;
  cartLabel: string;
  isWishlisted?: boolean;
  isInCart?: boolean;
};

export function ProductCard({
  product,
  titleLevel = 2,
  wishlistLabel,
  cartLabel,
  isWishlisted = false,
  isInCart = false,
}: ProductCardProps) {
  const Title = titleLevel === 2 ? "h2" : "h3";

  return (
    <article className="grid gap-2">
      <Image
        className="block aspect-square w-full bg-[#ececec] object-cover"
        src={product.image}
        alt={product.imageAlt}
        width={400}
        height={400}
      />
      <p>{product.brand}</p>
      <Title>{product.name}</Title>
      <strong>{product.priceText}</strong>
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="border border-[#c8c8c8] bg-transparent px-3 py-2 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#2557a7]"
          type="button"
          aria-label={wishlistLabel}
          aria-pressed={isWishlisted}
        >
          찜
        </button>
        <button
          className="border border-[#c8c8c8] bg-transparent px-3 py-2 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#2557a7]"
          type="button"
          aria-label={cartLabel}
          aria-pressed={isInCart}
        >
          담기
        </button>
      </div>
    </article>
  );
}
