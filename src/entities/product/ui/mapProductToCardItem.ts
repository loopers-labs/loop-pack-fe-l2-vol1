import type { ProductCardItem } from "./ProductCard";
import type { Product } from "../model/types";

export function mapProductToCardItem(product: Product): ProductCardItem {
  return {
    id: product.id,
    image: product.image,
    imageAlt: product.name,
    brand: product.brand,
    name: product.name,
    priceText: `${product.price.toLocaleString()}원`,
  };
}
