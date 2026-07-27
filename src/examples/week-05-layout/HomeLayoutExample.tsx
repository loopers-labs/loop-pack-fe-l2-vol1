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
export function HomeLayoutExample() {
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
      <section className="flex min-h-55 flex-col justify-end gap-2 bg-[#ececec] p-8 max-[480px]:min-h-45 max-[480px]:p-6">
        <p>배너 설명</p>
        <h1>홈 배너 제목</h1>
      </section>
      <section className="mt-10">
        <h2 className="mb-4">카테고리</h2>
        <div className="flex flex-wrap items-center gap-3">
          <For each={['캐주얼', '패션', '뷰티·잡화', '홈', '디지털']}>
            {(category) => (
              <Link
                key={category}
                href="/products"
                className="border border-[#c8c8c8] bg-transparent px-3 py-2 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#2557a7]"
              >
                {category}
              </Link>
            )}
          </For>
        </div>
      </section>
      <For each={['인기 상품', '신상품']}>
        {(title) => (
          <section className="mt-10" key={title}>
            <h2 className="mb-4">{title}</h2>
            <div className="grid grid-cols-2 gap-5 max-[480px]:gap-x-3 max-[480px]:gap-y-6 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5 lg:gap-5">
              <For each={Array.from({ length: 4 }, (_, index) => index)}>
                {(index) => {
                  const itemNumber = String(index + 1)
                  return (
                    <article
                      key={`${title}-${String(index)}`}
                      className="grid gap-2"
                    >
                      <Image
                        className="block aspect-square w-full bg-[#ececec] object-cover"
                        src={
                          title === '인기 상품'
                            ? '/images/products/p1.jpg'
                            : '/images/products/p6.jpg'
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
                        <Show
                          when={title === '인기 상품'}
                          fallback="WOMAN GNRL 케이블 풀오버 [IVORY] / WBC3L05502"
                        >
                          [11월 20일 예약배송] Winter Rocky Pants 2color 윈터
                          로키팬츠 OG
                        </Show>
                      </h3>
                      <strong>0원</strong>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          aria-label={`${title} ${itemNumber}번 상품 위시리스트`}
                          aria-pressed={false}
                          className="border border-[#c8c8c8] bg-transparent px-3 py-2 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#2557a7]"
                        >
                          찜
                        </button>
                        <button
                          type="button"
                          aria-label={`${title} ${itemNumber}번 상품 장바구니`}
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
          </section>
        )}
      </For>
    </main>
  )
}
