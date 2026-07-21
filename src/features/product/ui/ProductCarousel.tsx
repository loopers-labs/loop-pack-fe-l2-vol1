import { Product } from '@/types/commerce';
import { HomeCategory } from '../../home/types';
import styles from './ProductCarousel.module.css';
import Image from 'next/image';
import { WishlistButton } from '@/features/wishlist/ui/WishlistButton';
import { CartButton } from '@/features/cart/ui/CartButton';

export const ProductCarousel = ({ list, title }: { list: Product[]; title: HomeCategory }) => {
  return (
    <section className={styles.section} key={title}>
      <h2>{title}</h2>
      <div className={styles.grid}>
        {list.length === 0 ? (
          <p>검색 결과가 없습니다.</p>
        ) : (
          list.map((product) => (
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
          ))
        )}
      </div>
    </section>
  );
};
