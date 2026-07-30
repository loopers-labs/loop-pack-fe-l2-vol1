import Image from "next/image";
import type { Product } from "@/entities/product";
import { formatPrice } from "@/shared/lib";
import { AddToCartButton } from "@/features/add-to-cart";
import { WishlistButton } from "@/features/toggle-wishlist";
import styles from "@/components/commerce/commerce.module.css";

const CARD_IMAGE_SIZE = 300;

export function ProductCard({ product }: { product: Product }) {
  const { price, originalPrice } = product;
  const hasDiscount = originalPrice !== null && originalPrice > price;

  return (
    <article className={styles.card}>
      <Image
        className={styles.cardImage}
        src={product.image}
        alt={product.name}
        width={CARD_IMAGE_SIZE}
        height={CARD_IMAGE_SIZE}
      />
      <p className={styles.cardBrand}>{product.brand}</p>
      <h3 className={styles.cardName}>{product.name}</h3>
      <div className={styles.cardPriceRow}>
        <strong className={styles.cardPrice}>{formatPrice(price)}</strong>
        {hasDiscount && (
          <span className={styles.cardOriginalPrice}>
            {formatPrice(originalPrice)}
          </span>
        )}
      </div>
      <div className={styles.cardActions}>
        <AddToCartButton productId={product.id} />
        <WishlistButton productId={product.id} />
      </div>
    </article>
  );
}
