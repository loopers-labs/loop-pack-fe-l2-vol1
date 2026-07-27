import { For, Show } from '@ilokesto/utilinent'
import Image from 'next/image'
import Link from 'next/link'

/**
 * 5주차 과제를 빠르게 시작할 수 있도록 제공하는 최소 레이아웃 예시입니다.
 * 이 구조는 상태관리 아키텍처의 정답이 아닙니다.
 * 그대로 사용하거나, 기존 컴포넌트를 재사용하거나, 자유롭게 교체해도 됩니다.
 * 데이터 조회, Query 구성, 전역 상태와 이벤트 연결은 포함되어 있지 않습니다.
 * 실제 상태를 연결할 때 각 버튼의 aria-pressed를 해당 상품의 포함 여부로 바꿉니다.
 */
export function ProductListLayoutExample() {
  return (
    <main className="mx-auto w-[calc(100%-2rem)] max-w-300 py-6 pb-16 sm:py-6">
      <header className="flex flex-wrap items-center justify-between gap-3 pb-6 max-[480px]:items-start max-[480px]:gap-4 sm:items-center sm:justify-between sm:gap-3">
        <Link href="/">Commerce</Link>
        <nav
          aria-label="주요 메뉴"
          className="flex flex-wrap items-center gap-3 max-[480px]:w-full"
        >
          <Link href="/products">상품</Link>
          <span>위시리스트 0</span>
          <span>장바구니 0</span>
        </nav>
      </header>
      <section className="mt-10">
        <h1 className="mb-4">상품 목록</h1>
        <form className="flex flex-wrap items-center gap-3 max-[720px]:gap-3">
          <label className="grid gap-1.5 max-[720px]:basis-full">
            검색
            <input
              name="q"
              placeholder="상품명 또는 브랜드"
              className="min-h-10 border border-[#c8c8c8] bg-transparent px-2.5 py-2 text-inherit focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#2557a7]"
            />
          </label>
          <label className="grid gap-1.5 max-[720px]:basis-full">
            카테고리
            <select
              name="category"
              defaultValue="all"
              className="min-h-10 border border-[#c8c8c8] bg-transparent px-2.5 py-2 text-inherit focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#2557a7]"
            >
              <option value="all">전체</option>
              <option value="casual">캐주얼</option>
              <option value="fashion">패션</option>
              <option value="goods">뷰티·잡화</option>
              <option value="home">홈</option>
              <option value="digital">디지털</option>
            </select>
          </label>
          <label className="grid gap-1.5 max-[720px]:basis-full">
            정렬
            <select
              name="sort"
              defaultValue="latest"
              className="min-h-10 border border-[#c8c8c8] bg-transparent px-2.5 py-2 text-inherit focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#2557a7]"
            >
              <option value="latest">최신순</option>
            </select>
          </label>
        </form>
      </section>
      <section className="mt-10" aria-label="상품 검색 결과">
        <p>총 0개</p>
        <div className="grid grid-cols-2 gap-5 max-[480px]:gap-x-3 max-[480px]:gap-y-6 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5 lg:gap-5">
          <For each={Array.from({ length: 8 }, (_, index) => index)}>
            {(index) => {
              const itemNumber = String(index + 1)
              return (
                <article key={index} className="grid gap-2">
                  <Image
                    className="block aspect-square w-full bg-[#ececec] object-cover"
                    src={
                      index % 2 === 0
                        ? '/images/products/p11.jpg'
                        : '/images/products/p16.jpg'
                    }
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
                    <Show
                      when={index % 2 === 0}
                      fallback="스탠리 클래식 런치박스"
                    >
                      하이드레이팅 나이트 립 마스크 25g + 소프트 글로우 결 토너
                      210ml
                    </Show>
                  </h2>
                  <strong>0원</strong>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      aria-label={`${itemNumber}번 상품 위시리스트`}
                      aria-pressed={false}
                      className="border border-[#c8c8c8] bg-transparent px-3 py-2 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#2557a7]"
                    >
                      찜
                    </button>
                    <button
                      type="button"
                      aria-label={`${itemNumber}번 상품 장바구니`}
                      aria-pressed={false}
                      className="border border-[#c8c8c8] bg-transparent px-3 py-2 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#2557a7]"
                    >
                      담기
                    </button>
                  </div>
                </article>
              )
            }}
          </For>
        </div>
        <nav
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
          aria-label="페이지 이동"
        >
          <button
            type="button"
            className="border border-[#c8c8c8] bg-transparent px-3 py-2 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#2557a7]"
          >
            이전
          </button>
          <span>1 / 1</span>
          <button
            type="button"
            className="border border-[#c8c8c8] bg-transparent px-3 py-2 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#2557a7]"
          >
            다음
          </button>
        </nav>
      </section>
    </main>
  )
}
