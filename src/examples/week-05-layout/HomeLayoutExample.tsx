import Image from 'next/image';
import Link from 'next/link';

import './week-05-layout.css';

/**
 * 5주차 과제를 빠르게 시작할 수 있도록 제공하는 최소 레이아웃 예시입니다.
 * 이 구조는 상태관리 아키텍처의 정답이 아닙니다.
 * 그대로 사용하거나, 기존 컴포넌트를 재사용하거나, 자유롭게 교체해도 됩니다.
 * 데이터 조회, Query 구성, 전역 상태와 이벤트 연결은 포함되어 있지 않습니다.
 * 실제 상태를 연결할 때 각 버튼의 aria-pressed를 해당 상품의 포함 여부로 바꿉니다.
 */
export function HomeLayoutExample() {
  return (
    <main className="week05-page">
      <header className="week05-header">
        <Link href="/">Commerce</Link>
        <nav aria-label="주요 메뉴">
          <Link href="/products">상품</Link>
          <span>위시리스트 0</span>
          <span>장바구니 0</span>
        </nav>
      </header>
      <section className="week05-hero">
        <p>배너 설명</p>
        <h1>홈 배너 제목</h1>
      </section>
      <section className="week05-section">
        <h2>카테고리</h2>
        <div className="week05-categories">
          {['캐주얼', '패션', '뷰티·잡화', '홈', '디지털'].map((category) => (
            <Link key={category} href="/products">
              {category}
            </Link>
          ))}
        </div>
      </section>
      {['인기 상품', '신상품'].map((title) => (
        <section className="week05-section" key={title}>
          <h2>{title}</h2>
          <div className="week05-grid">
            {Array.from({ length: 4 }, (_, index) => (
              <article className="week05-product" key={`${title}-${index}`}>
                <Image
                  className="week05-image"
                  src={title === '인기 상품' ? '/images/products/p1.jpg' : '/images/products/p6.jpg'}
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
                  <button type="button" aria-label={`${title} ${index + 1}번 상품 위시리스트`} aria-pressed={false}>
                    찜
                  </button>
                  <button type="button" aria-label={`${title} ${index + 1}번 상품 장바구니`} aria-pressed={false}>
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
}
