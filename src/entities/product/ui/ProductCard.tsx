import Image from "next/image";
import type { ReactNode } from "react";

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
  floatingAction?: ReactNode;
  bottomAction?: ReactNode;
};

const PRODUCT_CARD_IMAGE_SIZES =
  "(min-width: 1024px) 224px, (min-width: 768px) 30vw, calc((100vw - 44px) / 2)";

export function ProductCard({
  product,
  titleLevel = 2,
  floatingAction,
  bottomAction,
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
          sizes={PRODUCT_CARD_IMAGE_SIZES}
        />
        {floatingAction !== undefined ? (
          <div className="absolute right-2 bottom-2" data-slot="floating-action">
            {floatingAction}
          </div>
        ) : null}
      </div>
      <p className="text-xs font-semibold text-gds-gray-700">{product.brand}</p>
      <Title className="line-clamp-2 min-h-[3.25rem] text-sm leading-7 font-medium text-gds-gray-900">
        {product.name}
      </Title>
      <strong className="text-lg leading-none font-bold text-black">{product.priceText}</strong>
      {bottomAction !== undefined ? <div data-slot="bottom-action">{bottomAction}</div> : null}
    </article>
  );
}
