# week-07 3단계 설계 — 동적 metadata와 Open Graph

대상: `app/layout.tsx`(루트), `app/page.tsx`(홈), `app/products/page.tsx`(목록)
기준 SHA: `44e14915` + 미커밋 변경(`commerce.css` 클램프, `measurement-and-decisions.md`)

---

## 0. 이 설계의 근거가 된 실측

production build(`APP_ORIGIN=http://127.0.0.1:3001 pnpm build && pnpm start -p 3001`), `curl`, 로컬 루프백, throttling 없음. 이 시점에는 `generateMetadata`가 없고 루트 정적 `metadata`만 있었다.

### API 지연 계약

| 엔드포인트 | total (3회) |
|---|---|
| `/api/home` (scenario 없음) | 0.512 / 0.508 / 0.508 s |
| `/api/products?…&scenario=slow` | 1.508 / 1.504 / 1.507 s |

`getProductList`가 요청 URL에 항상 `scenario=slow`를 붙이므로 목록은 상시 1.5초다.

### baseline document TTFB (5회)

| 경로 | `time_starttransfer` raw | 중앙값 | 범위 |
|---|---|---|---|
| `/` | 0.571 / 0.522 / 0.520 / 0.520 / 0.522 | 0.522 s | 0.520–0.571 |
| `/products` | 0.0099 / 0.0063 / 0.0070 / 0.0056 / 0.0052 | 0.0063 s | 0.005–0.010 |

`total`은 `time_starttransfer`와 1ms 이내 차이 — 스트리밍 후속 chunk가 사실상 없다.

### baseline 초기 HTML

| 항목 | `/` | `/products` |
|---|---|---|
| `<title>` | `Commerce` | `Commerce` (동일) |
| `description` | 루트 값 그대로 | 루트 값 그대로 |
| `og:*` | 없음 | 없음 |
| `h1` | **없음** (h2부터: 매일 새롭게 발견하는 취향 / 카테고리 / 인기 상품 / 신상품) | `상품 목록` 1개 |

### 여기서 읽은 것

두 페이지의 비용 구조가 다르다.

- **목록** — 셸이 6ms에 나간다. 본문을 클라이언트 `useQuery`가 소유해서 서버가 아무것도 기다리지 않기 때문이다. `generateMetadata`가 `productQueries.list`를 await하면 TTFB가 6ms → 약 1506ms로, 없던 1.5초를 새로 만든다. 본문은 브라우저가 따로 fetch하므로 request 범위 fetch memoization의 수혜도 없다 — Route Handler 호출이 서버 1회 + 브라우저 1회로 실제로 늘어난다.
- **홈** — 셸이 이미 522ms 막혀 있다. `HomePage`가 루트에서 `await queryClient.prefetchQuery(homeQueries.detail())`를 하기 때문이고, 522ms는 `/api/home`의 500ms와 맞는다. `generateMetadata`가 같은 request 안에서 같은 URL·options로 `/api/home`을 부르면 native fetch memoization 대상이 되어 순증이 0에 가까울 수 있다 — **미검증. 구현 후 서버 로그 계수로 확인한다.**

---

## 1. 결정 요약

| 항목 | 결정 | 근거 |
|---|---|---|
| 목록 metadata의 +1.5초 TTFB | 그대로 받고 비용으로 기록한다 | 발제가 요구한 동적 metadata를 만족시키되, timeout 폴백은 slow가 항상 1.5초라 사실상 항상 폴백되어 동적 metadata가 사라진다 |
| 홈 셸의 522ms 대기 | 3단계에서 건들지 않는다 | metadata 변경 효과를 분리해 측정하기 위해 |
| title template | `%s \| Commerce` | 검색 결과에서 브랜드가 잘려도 페이지 제목이 먼저 읽힌다 |
| 홈 title | template 적용 | 홈만 예외 규칙을 만들지 않는다 |
| metadata 조회 실패 | 모든 예외를 catch → `{}` 반환 | 발제는 root 상속만 요구한다. 상태 코드 분기는 현재 API 계약상 실효가 없다 |
| og:title·og:description | 페이지 title·description과 같은 소스 | 문구 조합 지점을 한 곳으로 둔다 |
| 홈 `h1` | 셸에 정적 `h1` 추가 | 데이터가 늦어도 초기 HTML에 `h1`이 보장된다 |
| `robots` | 설정하지 않는다 | 기본 색인 가능 유지 |

---

## 2. 루트 layout metadata

파일: `src/_app/RootLayout.tsx` (`app/layout.tsx`가 re-export)

```ts
export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_ORIGIN),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: {
    ...commonOpenGraph,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [OG_FALLBACK_IMAGE]
  }
};
```

`SITE_NAME`·`SITE_DESCRIPTION`·`OG_FALLBACK_IMAGE`·`commonOpenGraph`는 `src/shared/config/siteMetadata.ts`에 이미 있다(커밋 `98175e3b`).

- `metadataBase`가 있어야 `OG_FALLBACK_IMAGE` 같은 상대 경로가 절대 URL로 직렬화된다.
- `APP_ORIGIN`이 비면 `http://localhost:3000`으로 폴백한다(Next.js도 `metadataBase`를 선택 항목으로 정의해 없으면 경고 후 localhost로 폴백함 — 그 계약을 그대로 따름). CI(`quality.yml`)가 `APP_ORIGIN` 없이 `pnpm check`를 돌리는데, 처음엔 모듈 최상위에서 `throw`했다가 루트 layout이 모든 라우트의 page data 수집에 걸려 빌드가 통째로 실패해 되돌렸다. `APP_ORIGIN`을 설정하면(측정·재현 절차 전체) 폴백은 적용되지 않아 기존 동작과 동일하다.
- `robots`를 넣지 않는다.

### shallow merge 대응

페이지의 `openGraph`는 루트 `openGraph`와 shallow merge되어 루트 값 전체를 덮는다. 페이지에서 `images`만 지정해도 `siteName`·`locale`·`type`이 통째로 사라진다. 따라서 **각 페이지는 `commonOpenGraph`를 펼친 위에 자기 필드를 얹는다.** 이 규칙이 홈·목록 양쪽에 동일하게 적용된다.

---

## 3. 홈 generateMetadata

파일: `src/_pages/home/api/generateHomeMetadata.ts`
배럴: `src/_pages/home/index.ts`에 export 추가
연결: `app/page.tsx`에서 `export { generateHomeMetadata as generateMetadata } from '@/_pages/home';`

```ts
export async function generateHomeMetadata(): Promise<Metadata> {
  try {
    const home = await getQueryClient().fetchQuery(homeQueries.detail());
    return {
      title: home.banner.title,
      description: home.banner.description,
      openGraph: {
        ...commonOpenGraph,
        title: home.banner.title,
        description: home.banner.description,
        images: [home.banner.image]
      }
    };
  } catch {
    return {};
  }
}
```

- 본문 prefetch와 **같은 `homeQueries.detail()`** 을 쓴다 → 같은 GET URL·options.
- `getQueryClient()`는 호출마다 새 QueryClient다. metadata와 본문은 Query 캐시를 공유하지 않는다. 중복이 사라진다면 그건 같은 render/request의 native fetch memoization 때문이지 Query 캐시 때문이 아니다.
- 결과 title: `매일 새롭게 발견하는 취향 | Commerce` (루트 template 적용)
- `og:title`에는 template이 적용되지 않아 `매일 새롭게 발견하는 취향`이 된다. 링크 미리보기에는 `og:site_name`이 따로 표시되므로 브랜드명을 중복해서 붙이지 않는다.
- 홈은 검색어·빈 결과 개념이 없어 분기가 **정상 / 실패 2개**다.
- `app/page.tsx`의 `export const dynamic = 'force-dynamic'`은 그대로 둔다.

### 홈 셸의 정적 `h1`

현재 홈에는 `h1`이 없고 hero의 `h2`(`매일 새롭게 발견하는 취향`)부터 시작한다. hero는 Suspense 안이라 데이터 도착 전에는 초기 HTML에 없다.

→ **Suspense 밖 셸에 배너 데이터와 무관한 정적 `h1`을 둔다.** hero의 `h2`는 그대로 유지한다. 데이터가 늦어도 초기 HTML에 `h1`과 페이지 설명이 보장된다.

---

## 4. 목록 generateMetadata

파일: `src/_pages/product-list/api/generateProductListMetadata.ts`

```ts
const loadFilters = createLoader(productListParsers);

export async function generateProductListMetadata({ searchParams }): Promise<Metadata> {
  const filters = await loadFilters(searchParams);   // try 밖 — 파싱은 실패 대상이 아니다
  try {
    const data = await getQueryClient().fetchQuery(productQueries.list(filters));
    return { title, description, openGraph: { ...commonOpenGraph, title, description, images: [ogImage] } };
  } catch {
    return {};
  }
}
```

- `createLoader(productListParsers)` → `productQueries.list(filters)` → 내부에서 `toProductListQuery()`. 본문과 **같은 parser·같은 정규화·같은 query factory**를 지난다.
- `productQueries.list`의 `placeholderData: keepPreviousData`는 `fetchQuery`가 무시하므로 무해하다.
- 필터 파싱을 `try` 밖에 두어, root 상속 대상을 "조회 실패"로만 한정한다.

### title 규칙

```
base  = filters.q ? `'${q}' 검색 결과` : '상품 목록'
title = filters.page > FIRST_PAGE ? `${base} (${page}페이지)` : base
```

| 조건 | 결과 |
|---|---|
| 기본 (q 없음, all, page 1) | `상품 목록 \| Commerce` |
| `q=가방` | `'가방' 검색 결과 \| Commerce` |
| `category=fashion` (q 없음) | `상품 목록 \| Commerce` |
| `page=2` (q 없음) | `상품 목록 (2페이지) \| Commerce` |
| `q=가방 & page=2` | `'가방' 검색 결과 (2페이지) \| Commerce` |

기본값 `상품 목록`은 현재 `/products`의 `h1`과 같은 문구다 — 탭 제목과 본문이 이어진다.

표시용 검색어는 `filters.q`를 `trim()`만 해서 쓴다. `toProductListQuery`의 소문자 정규화는 **GET 요청 URL에만** 적용되고, 화면 문구는 사용자가 입력한 대소문자를 유지한다.

### description 규칙

조건 나열형. 구분자는 ` · `.

```
[검색어(있을 때만)] · [카테고리명] · [정렬] · 총 N개
```

| 조건 | 결과 |
|---|---|
| `q=가방 & fashion & price-asc`, 37개 | `'가방' · 패션 · 가격 낮은순 · 총 37개` |
| 기본 (all & latest), 37개 | `전체 · 최신순 · 총 37개` |
| 정상 empty (`q=가방 & fashion`), 0개 | `'가방' · 패션 · 최신순 · 총 0개` |

- **카테고리명은 응답의 `categories`에서 찾는다**(하드코딩 맵을 만들지 않는다). `all`만 `전체` 고정.
- **정렬 라벨은 기존 `SORT_LABELS`를 재사용한다.** 현재 이 상수가 `ui/ProductListSection.tsx` 안에 로컬로 선언돼 있어 `api` 레이어가 `ui`를 import하게 된다 → `model/productListConstants.ts`로 올려 ui와 metadata가 함께 쓰게 한다. 라벨 문구(`가격 낮은순`/`가격 높은순`)는 화면에 이미 보이는 값 그대로 둔다.
- 정상 empty도 같은 조합을 쓴다. 결과가 `총 0개`로 나오므로 별도 문장을 만들지 않는다 — URL 조건과 0건이 한 줄에 다 드러난다.

### Open Graph image

```
images: [data.products[0]?.image ?? OG_FALLBACK_IMAGE]
```

정상 empty면 `products`가 비어 자연스럽게 fallback image가 유지된다.

### 분기

| 상황 | title·description | og:image |
|---|---|---|
| normal | 위 규칙 | 첫 상품 이미지 |
| 정상 empty | 위 규칙, `총 0개` | fallback |
| query failure | 반환하지 않음 → root 상속 | root의 fallback |

정상 empty와 query failure가 서로 다른 결과를 낸다: 전자는 URL 조건이 반영된 페이지별 metadata, 후자는 루트 공통 metadata.

---

## 5. 접근성 최소 회귀

| 항목 | 조치 |
|---|---|
| 하나의 `h1` | 홈 셸에 정적 `h1` 추가. 목록은 `상품 목록` 유지 |
| 역할이 드러나는 마크업 | 현재 구조 유지, 변경 없음 |
| `href` 링크 | 현재 구조 유지, 변경 없음 |
| 이미지 `alt` | 현재 구조 유지, 변경 없음 |

---

## 6. 구현 후 확인할 것

| 확인 | 방법 |
|---|---|
| 홈 metadata의 순증 비용 | `/` TTFB 5회 재측정 → baseline 0.522s와 비교 |
| 목록 metadata의 순증 비용 | `/products` TTFB 5회 재측정 → baseline 0.0063s와 비교 |
| 서버 호출 계수 | Route Handler에 임시 로그 → `/`·`/products` 각 1요청당 호출 횟수 → **계측 제거** |
| fetch memoization 범위 | 위 계수로 홈이 1회인지 2회인지 확정 |
| shallow merge | document HTML에서 `og:site_name`·`og:locale`·`og:type`이 남아 있는지 |
| normal 증거 | `APP_ORIGIN` 설정 상태의 production document 응답 + 초기 HTML |
| 정상 empty 증거 | 0건이 나오는 URL 조건 + metadata + fallback image |
| query failure 증거 | `APP_ORIGIN=http://127.0.0.1:9`로 build·start → root 공통 metadata 상속 확인 |
| robots | document HTML에 `noindex`가 없는지 |
| document/RSC 경계 | Network에서 document·RSC 요청과 최종 URL 대조 |
| 초기 HTML | document Response / View Source / JS 끈 요청 중 하나 |
| UA 비교 | 일반 UA vs `facebookexternalhit`의 `time_starttransfer`·`time_total` |

---

## 7. 이번 설계에서 하지 않는 것

`canonical`/`alternates`, `sitemap`, `robots.txt`, JSON-LD, Twitter Card 전용 필드, OG 이미지 동적 생성. 발제 범위 밖이고 현재 병목과 무관하다.
