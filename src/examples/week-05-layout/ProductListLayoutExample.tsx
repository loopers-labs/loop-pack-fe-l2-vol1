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
export function ProductListLayoutExample() {
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
      <section className="week05-section">
        <h1>상품 목록</h1>
        <form className="week05-filters">
          <label>
            검색
            <input name="q" placeholder="상품명 또는 브랜드" />
          </label>
          <label>
            카테고리
            <select name="category" defaultValue="all">
              <option value="all">전체</option>
              <option value="casual">캐주얼</option>
              <option value="fashion">패션</option>
              <option value="goods">뷰티·잡화</option>
              <option value="home">홈</option>
              <option value="digital">디지털</option>
            </select>
          </label>
          <label>
            정렬
            <select name="sort" defaultValue="latest">
              <option value="latest">최신순</option>
            </select>
          </label>
        </form>
      </section>
      <section className="week05-section" aria-label="상품 검색 결과">
        <p>총 0개</p>
        <div className="week05-grid">
          {Array.from({ length: 8 }, (_, index) => (
            <article className="week05-product" key={index}>
              <Image
                className="week05-image"
                src={index % 2 === 0 ? '/images/products/p11.jpg' : '/images/products/p16.jpg'}
                alt={
                  index % 2 === 0
                    ? '하이드레이팅 나이트 립 마스크 25g + 소프트 글로우 결 토너 210ml'
                    : '스탠리 클래식 런치박스'
                }
                width={400}
                height={400}
              />
              <p>브랜드</p>
              <h2>
                {index % 2 === 0
                  ? '하이드레이팅 나이트 립 마스크 25g + 소프트 글로우 결 토너 210ml'
                  : '스탠리 클래식 런치박스'}
              </h2>
              <strong>0원</strong>
              <div>
                <button type="button" aria-label={`${index + 1}번 상품 위시리스트`} aria-pressed={false}>
                  찜
                </button>
                <button type="button" aria-label={`${index + 1}번 상품 장바구니`} aria-pressed={false}>
                  담기
                </button>
              </div>
            </article>
          ))}
        </div>
        <nav className="week05-pagination" aria-label="페이지 이동">
          <button type="button">이전</button>
          <span>1 / 1</span>
          <button type="button">다음</button>
        </nav>
      </section>
    </main>
  );
}
