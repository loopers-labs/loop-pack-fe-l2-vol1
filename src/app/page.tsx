'use client';

import Link from 'next/link';
import styles from './page.module.css';
import { CategoryId } from '@/types/commerce';
import { useQuery } from '@tanstack/react-query';
import { homeQueries } from '@/features/home/api/queries';
import { HomeCategory } from '@/features/home/types';
import { Section } from '@/features/home/ui/Section';

const HomeCategoryArr: HomeCategory[] = ['인기 상품', '신상품'] as const;
const ProductCategoryArr: { id: CategoryId; label: string }[] = [
  { id: 'casual', label: '캐주얼' },
  { id: 'fashion', label: '패션' },
  { id: 'goods', label: '뷰티·잡화' },
  { id: 'home', label: '홈' },
  { id: 'digital', label: '디지털' },
] as const;

const Home = () => {
  const { data, isPending, isError } = useQuery(homeQueries.home());

  const renderItems = () => {
    if (isPending) {
      return <p>불러오는 중...</p>;
    }
    if (isError) {
      return <p role="alert">상품을 불러오지 못했습니다.</p>;
    }

    return HomeCategoryArr.map((title) => {
      const list = title === '인기 상품' ? data.popularProducts : data.newProducts;
      return <Section key={title} list={list} title={title} />;
    });
  };

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
      {renderItems()}
    </main>
  );
};

export default Home;
