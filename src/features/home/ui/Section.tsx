import { Product } from '@/types/commerce';
import { HomeCategory } from '../types';
import styles from './Section.module.css';
import Image from 'next/image';

export const Section = ({ list, title }: { list: Product[]; title: HomeCategory }) => {
  return (
    <section className={styles.section} key={title}>
      <h2>{title}</h2>
      <div className={styles.grid}>
        {list.length === 0 ? (
          <p>검색 결과가 없습니다.</p>
        ) : (
          list.map((product) => (
            <article key={product.id}>
              <Image src={product.image} alt={product.name} width={400} height={400} />
              <p>{product.brand}</p>
              <h3>{product.name}</h3>
              <strong>{product.price.toLocaleString()}원</strong>
              <div>
                <button
                  type="button"
                  aria-label={`${title} ${product.id} 상품 위시리스트`}
                  aria-pressed={false}
                >
                  찜
                </button>
                <button
                  type="button"
                  aria-label={`${title} ${product.id} 상품 장바구니`}
                  aria-pressed={false}
                >
                  담기
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
};
