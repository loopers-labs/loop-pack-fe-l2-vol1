import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';
import { CategoryId } from '@/types/commerce';

const HomeCategoryArr = ['인기 상품', '신상품'] as const;
const ProductCategoryArr: { id: CategoryId; label: string }[] = [
  { id: 'casual', label: '캐주얼' },
  { id: 'fashion', label: '패션' },
  { id: 'goods', label: '뷰티·잡화' },
  { id: 'home', label: '홈' },
  { id: 'digital', label: '디지털' },
] as const;

const Home = () => {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/">Commerce</Link>
        <nav aria-label="주요 메뉴">
          <Link href="/products">상품</Link>
          <span>위시리스트 0</span>
          <span>장바구니 0</span>
        </nav>
      </header>
      <section className={styles.hero}>
        <p>배너 설명</p>
        <h1>홈 배너 제목</h1>
      </section>
      <section className={styles.section}>
        <h2>카테고리</h2>
        <div className={styles.categories}>
          {/* [AI] 클릭 시 /products?category=<id> 로 이동해 해당 카테고리가 적용된다. */}
          {ProductCategoryArr.map(({ id, label }) => (
            <Link key={id} href={`/products?category=${id}`}>
              {label}
            </Link>
          ))}
        </div>
      </section>
      {HomeCategoryArr.map((title) => (
        <section className={styles.section} key={title}>
          <h2>{title}</h2>
          <div className={styles.grid}>
            {Array.from({ length: 4 }, (_, index) => (
              <article className={styles.product} key={`${title}-${index}`}>
                <Image
                  className={styles.image}
                  src={
                    title === '인기 상품' ? '/images/products/p1.jpg' : '/images/products/p6.jpg'
                  }
                  alt={
                    title === '인기 상품'
                      ? '[11월 20일 예약배송] Winter Rocky Pants 2color 윈터 로키팬츠 OG'
                      : 'WOMAN GNRL 케이블 풀오버 [IVORY] / WBC3L05502'
                  }
                  width={400}
                  height={400}
                />
                <p>브랜드</p>
                <h3>
                  {title === '인기 상품'
                    ? '[11월 20일 예약배송] Winter Rocky Pants 2color 윈터 로키팬츠 OG'
                    : 'WOMAN GNRL 케이블 풀오버 [IVORY] / WBC3L05502'}
                </h3>
                <strong>0원</strong>
                <div>
                  <button
                    type="button"
                    aria-label={`${title} ${index + 1}번 상품 위시리스트`}
                    aria-pressed={false}
                  >
                    찜
                  </button>
                  <button
                    type="button"
                    aria-label={`${title} ${index + 1}번 상품 장바구니`}
                    aria-pressed={false}
                  >
                    담기
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
};

export default Home;
