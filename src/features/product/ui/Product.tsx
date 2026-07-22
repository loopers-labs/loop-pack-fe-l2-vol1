import { Product as ProductType } from '@/types/commerce';
import styles from './Product.module.css';
import Image from 'next/image';
import { WishlistButton } from '@/features/wishlist/ui/WishlistButton';
import { CartButton } from '@/features/cart/ui/CartButton';

export const Product = ({ product }: { product: ProductType }) => {
  return (
    <article className={styles.product} key={product.id}>
      <Image
        className={styles.image}
        src={product.image}
        alt={product.name}
        width={400}
        height={400}
      />
      <p>{product.brand}</p>
      <h3>{product.name}</h3>
      <strong>{product.price.toLocaleString()}원</strong>
      <div>
        <WishlistButton product={product} />
        <CartButton product={product} />
      </div>
    </article>
  );
};
