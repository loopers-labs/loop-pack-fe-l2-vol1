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
  isInWishlist: boolean;
  isInCart: boolean;
  isActionDisabled?: boolean;
  onWishlistToggle: () => void;
  onCartToggle: () => void;
};

export function ProductCard({
  product,
  titleLevel = 2,
  wishlistLabel,
  cartLabel,
  isInWishlist,
  isInCart,
  isActionDisabled = false,
  onWishlistToggle,
  onCartToggle,
}: ProductCardProps) {
  const Title = titleLevel === 2 ? "h2" : "h3";

  return (
    <article className="group grid gap-2.5">
      <div className="relative overflow-hidden rounded-gds-md bg-gds-gray-200">
        <Image
          className="block aspect-square w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          src={product.image}
          alt={product.imageAlt}
          width={400}
          height={400}
        />
        <button
          className="absolute right-2 bottom-2 inline-flex size-8 cursor-pointer items-center justify-center rounded-full bg-white/85 text-base leading-none font-semibold text-gds-gray-700 shadow-[0_1px_4px_rgba(0,0,0,0.12)] ring-1 ring-black/5 hover:bg-white hover:text-gds-red-500 disabled:cursor-not-allowed disabled:opacity-60 aria-pressed:bg-white aria-pressed:text-gds-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gds-green-500"
          type="button"
          aria-label={wishlistLabel}
          aria-pressed={isInWishlist}
          disabled={isActionDisabled}
          onClick={onWishlistToggle}
        >
          <span aria-hidden>{isInWishlist ? "♥" : "♡"}</span>
          <span className="sr-only">{isInWishlist ? "찜 해제" : "찜"}</span>
        </button>
      </div>
      <p className="text-xs font-semibold text-gds-gray-700">{product.brand}</p>
      <Title className="line-clamp-2 min-h-[3.25rem] text-sm leading-7 font-medium text-gds-gray-900">
        {product.name}
      </Title>
      <strong className="text-lg leading-none font-bold text-black">{product.priceText}</strong>
      <button
        className="mt-0.5 inline-flex h-8 w-full cursor-pointer items-center justify-center rounded-gds-sm border border-gds-gray-300 bg-white px-3 text-xs font-semibold text-gds-gray-900 hover:border-gds-green-500 hover:text-gds-green-700 disabled:cursor-not-allowed disabled:border-gds-gray-200 disabled:text-gds-gray-500 aria-pressed:border-gds-green-500 aria-pressed:bg-gds-green-50 aria-pressed:text-gds-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gds-green-500"
        type="button"
        aria-label={cartLabel}
        aria-pressed={isInCart}
        disabled={isActionDisabled}
        onClick={onCartToggle}
      >
        {isInCart ? "빼기" : "담기"}
      </button>
    </article>
  );
}
