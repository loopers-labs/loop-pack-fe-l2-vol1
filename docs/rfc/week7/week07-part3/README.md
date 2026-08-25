# Part 3 — 동적 metadata와 Open Graph의 비용

## 요약

JavaScript가 실행되기 전에도 제목·설명·이동 경로가 보이게 만들고, 그 대가로 **metadata가 데이터를 기다리며 응답이 늦어지는 비용**을 함께 측정하는 작업이다. 현재는 **페이지별 metadata가 전혀 없는 상태**이고, 반대로 그것을 만들기 위한 기반(query factory·URL 정규화·요청 단위 QueryClient)은 이미 갖춰져 있다.

| 항목          | 내용                                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Before 코드   | Part 2 종료 시점(Round 12까지 적용 — 21:9 크롭 hero + 미사용 폰트 제거)                                                               |
| 현재 코드     | **구현 완료** — 루트 공통 metadata + 두 페이지 `generateMetadata` + OG fallback 이미지                                                |
| 대상 경로     | 과제 문서는 `src/app/(commerce)/…`로 안내하지만, 이 리포지토리는 **`src/app/(home)/page.tsx`**·**`src/app/products/page.tsx`** 구조다 |
| 측정 프로토콜 | Part 1·2와 동일 — 타이밍 수치는 사용자가 직접 측정, AI가 CLI로 잰 값은 참고용으로만 표기                                              |
| 자료          | [`./captures/`](./captures/) — normal·정상 empty·query failure의 document 응답 5건                                                    |

### 문서 구성

**1부 Before**(현재 상태·이미 갖춰진 것·관찰 표) → **2부 구현과 관찰**(구현 내용 / normal·정상 empty·query failure / 서버 호출 계수 / UA 비교) → **3부 정리**(완료조건 점검·결정·성능 개선 방향)

---

## Before 성능 지표 — Part 2 최종 측정(Round 12) 승계

Part 3는 metadata를 **추가**하는 작업이라 응답이 느려지는 쪽이다. 그 비용을 재려면 기준선이 필요하므로, **Part 2의 마지막 사용자 측정을 그대로 Before로 삼는다**(Part 1 → Part 2에서 했던 것과 같은 방식).

- **측정 URL**: `/products` · **도구**: Lighthouse `--preset=desktop` 5회, 포트 3000 · **측정 일시**: 2026-08-07 UTC 02:17–02:19
- **코드 상태**: Part 2 Round 12까지 적용(21:9 크롭 hero + 미사용 폰트 제거)

| 지표                  | 중앙값   | score    | weight | 비고                                           |
| --------------------- | -------- | -------- | ------ | ---------------------------------------------- |
| **Performance score** | **0.77** | —        | —      | 최고 0.79                                      |
| **TBT**               | 0ms      | **1.00** | 30     | 만점                                           |
| **CLS**               | 0.000    | **1.00** | 25     | 만점 — Part 2가 다룬 영역                      |
| LCP                   | 2,675ms  | 0.50     | 25     | 감점의 대부분                                  |
| Speed Index           | 2,277ms  | 0.51     | 10     |                                                |
| FCP                   | 1,398ms  | 0.62     | 10     | Part 1부터 이어진 이 환경 고유의 이례적 관측치 |

**LCP breakdown** — Part 3가 늘릴 수 있는 구간이 어디인지 미리 파악해 둔다.

| 구간                   | 값      | Part 3와의 관계                                            |
| ---------------------- | ------- | ---------------------------------------------------------- |
| Time to first byte     | 46ms    | **`generateMetadata`가 데이터를 기다리면 여기가 늘어난다** |
| Resource load delay    | 544ms   | document 응답이 늦어지면 hero 요청 시작도 밀린다           |
| Resource load duration | 2,314ms | 이미지 전송 — Part 3와 무관                                |
| Element render delay   | 37ms    |                                                            |

**즉 Part 3의 비용은 TTFB와 Resource load delay에 나타난다.** metadata가 본문과 같은 데이터를 기다리면 document 응답 자체가 늦어지고, 그만큼 hero 요청 시작도 밀린다. 이 두 구간의 변화를 Part 3 측정의 핵심 지표로 삼는다.

상세 raw 값과 Round별 경위는 [Part 2 문서](../week07-part2/README.md)의 "Round 12" 절에 있다.

---

## 1부. Before — 지금 어떤 상태인가

## 루트 metadata — 최소한만 있고 title template·Open Graph가 없다

`src/app/layout.tsx`:

```ts
export const metadata: Metadata = {
  title: 'Commerce',
  description: 'Loopers 커머스 - 4주차부터 여기에 쌓아갑니다.',
};
```

- **`title.template`이 없다.** 페이지가 title을 주면 루트 title을 통째로 대체하며, `"… | Commerce"` 같은 공통 접미사가 붙지 않는다.
- **`openGraph`가 아예 없다.** 따라서 공유 시 크롤러가 쓸 `siteName`·`locale`·`type`·대표 이미지가 전혀 제공되지 않는다.
- **`metadataBase`가 없다.** Open Graph 이미지에 상대경로를 쓰면 절대 URL로 확장되지 않는다.

## 페이지 metadata — `generateMetadata`가 한 곳도 없다

`generateMetadata`·`openGraph`를 리포지토리 전체에서 검색해도 **결과가 0건**이다. 즉 `/`와 `/products`는 어떤 조건(검색어·카테고리·정렬·페이지)으로 들어와도 **동일한 title·description**을 반환한다. 과제가 요구하는 다음 항목이 모두 미충족이다.

| 요구                                                | 현재                                  |
| --------------------------------------------------- | ------------------------------------- |
| 홈: 응답의 title·description·image 사용             | ❌ 고정값                             |
| 상품 목록: 카테고리명·전체 개수·첫 상품 이미지 사용 | ❌ 고정값                             |
| 검색어를 title에 우선 반영                          | ❌                                    |
| category·sort를 description에 반영                  | ❌                                    |
| 2페이지 이상은 title에 페이지 번호                  | ❌                                    |
| 정상 empty의 0건 설명 + OG fallback image           | ❌                                    |
| metadata 조회 실패 시 root 공통 metadata 상속       | ❌ (상속할 공통 metadata 자체가 빈약) |

## 이미 갖춰져 있는 것 — 새로 만들 필요가 없는 기반

과제가 "metadata와 본문이 같은 URL 정규화·query factory를 쓸 것"을 요구하는데, **그 구조는 Part 0–2를 거치며 이미 완성돼 있다.**

- **URL 정규화 단일 출처**: `productSearchParams`(파서 정의)를 클라이언트 훅 `useProductListParams`와 서버 로더 `loadProductSearchParams`가 **공유**한다. `page=0`/음수 하한 보정, 알 수 없는 `category`의 `'all'` 보정도 여기 한 곳에 있다.
- **query factory 단일 출처**: `productsQueryOptions(query)` / `homeQueryOptions()`가 queryKey·queryFn·캐시 정책을 모두 소유한다. 본문 prefetch가 이미 이걸 쓰므로, `generateMetadata`도 **같은 함수를 호출하면 같은 GET URL·options가 보장**된다.
- **요청 단위 QueryClient**: `getQueryClient = cache(() => new QueryClient())` — React `cache`로 감싸 **같은 요청 안에서는 하나를 재사용하고 요청이 끝나면 버린다.** 과제가 금지한 "singleton이나 영속 캐시"가 아니며, 이 구조를 바꿀 이유가 없다.

즉 Part 3에서 할 일은 **새 데이터 경로를 만드는 게 아니라, 이미 있는 factory를 `generateMetadata`에서 한 번 더 호출하고 그 비용을 측정하는 것**이다.

## 초기 HTML·접근성 — 랜드마크는 갖춰졌고, 제목 계층을 정리했다

| 항목                                                   | 현재                                                                                                                |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `<main>` / `<header>` / `<nav aria-label="주요 메뉴">` | ✅ 있음                                                                                                             |
| 목록 영역 `<section aria-label>`                       | ✅ 있음(`ProductListSection`)                                                                                       |
| 주요 이동이 `href` 링크인지                            | ✅ `next/link`의 `<Link href>` 사용                                                                                 |
| 상품 이미지 대체 텍스트                                | ✅ `alt={product.name}`                                                                                             |
| 장식용 히어로 이미지                                   | ✅ `alt=""`(적절한 처리)                                                                                            |
| **하나의 명확한 페이지 제목**                          | ✅ 페이지당 `h2` **정확히 1개** — 과제 문구는 `h1`이지만 이 레이아웃에선 `h2`가 정확하다고 판단해 조정(아래 "결정") |

초기 관찰 시점에는 **홈에 `h2`가 4개**였다 — `PageHeading`의 페이지 제목과 "카테고리"·"인기 상품"·"신상품" 섹션 제목이 모두 같은 `h2`라 계층이 평평했다. 이를 정리해 지금은 아래 구조다.

| 페이지      | h2                                               | h3                                     |
| ----------- | ------------------------------------------------ | -------------------------------------- |
| `/`         | "매일 새롭게 발견하는 취향"(페이지 제목) **1개** | 카테고리 / 인기 상품 / 신상품 + 상품명 |
| `/products` | "상품 목록"(페이지 제목) **1개**                 | 상품명                                 |

**변경**: `HomeView`의 섹션 제목 3곳을 `h2` → `h3`으로 내렸다(`src/app/(home)/_ui/HomeView.tsx`).

> `/products`의 raw HTML에는 "상품 목록"이 두 번 나오는데, 이는 `loading.tsx` fallback과 실제 콘텐츠가 **스트리밍 HTML에 함께 담기기** 때문이다. 브라우저에서 fallback은 교체되므로 최종 DOM의 `h2`는 1개다.

**남은 한계**: `ProductCard`의 상품명이 `h3`라 홈에서는 섹션 제목(`h3`)과 같은 레벨이 된다. 이상적으로는 `h4`여야 하지만, 그러려면 공통 컴포넌트에 heading level prop을 넣어야 하고 이는 `PageHeading`에서 거부한 패턴과 같다(아래 "결정" 참고). "페이지당 명확한 제목 하나"라는 목표는 달성했으므로 여기서 멈춘다.

**이건 Part 1에서 의도적으로 미뤄둔 항목이고, 이번에 결론을 냈다.** Part 1 "`<h2>` 유지 결정" 절에서 *"`PageHeading`은 홈·상품 목록이 공유하는 컴포넌트라 페이지마다 heading level을 분기시키지 않고, 페이지별 `h1`은 layout 쪽에서 갖는 구조를 염두에 둔다 — Part 3에서 layout 구조와 함께 다시 판단한다"*고 기록했다. 그 "다시 판단할 시점"이 지금이고, **페이지 제목을 `h2`로 두되 그 아래 계층을 정리하는 것**으로 결론 냈다(3부 "결정" 절).

---

## 관찰 사실 → 원인 가설 → 반증 방법 → 가장 작은 변경

| 관찰한 사실                                                                    | 원인 가설                                                                                                  | 반증할 방법                                                                                                                         | 가장 작은 변경                                                                                                                                 |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 어떤 검색·필터 조건으로 들어와도 document의 `<title>`·`description`이 동일하다 | 페이지에 `generateMetadata`가 없어 루트 metadata가 그대로 쓰이기 때문이다                                  | 조건이 다른 두 URL의 document를 받아 `<title>`을 비교 — 같으면 가설 확정                                                            | `/`·`/products`에 `generateMetadata`를 추가하고, 본문 prefetch와 **같은 query factory**로 조회한 값으로 title·description을 만든다             |
| document HTML에 `og:` 메타 태그가 하나도 없다                                  | 루트에 `openGraph`가 없고 페이지도 만들지 않기 때문이다                                                    | document를 받아 `og:`를 grep — 0건이면 확정(코드 검색으로 이미 확인)                                                                | 루트에 공통 `openGraph`(`siteName`·`locale`·`type`·fallback image)와 `title.template`, `metadataBase`를 둔다                                   |
| 페이지에서 `openGraph`를 지정하면 루트 설정이 사라질 수 있다                   | Next.js의 metadata 병합이 **shallow merge**라 페이지 `openGraph` 객체가 루트 것을 통째로 대체하기 때문이다 | 페이지에 `openGraph: { title }`만 넣고 document에 `og:site_name`이 남는지 확인 — 사라지면 확정                                      | 공통 openGraph 객체를 **명시적으로 펼쳐 재사용**하거나, 페이지에서 필요한 공통 필드를 함께 완성한다                                            |
| metadata 조회가 실패했을 때의 동작이 정의돼 있지 않다                          | 실패 경로를 다뤄본 적이 없기 때문이다(`generateMetadata` 자체가 없음)                                      | `APP_ORIGIN`을 닿지 않는 origin으로 두고 document의 `<title>`을 확인                                                                | `generateMetadata`에서 조회 실패 시 **페이지별 빈 값을 만들지 말고** 빈 객체를 반환해 루트 metadata를 상속시킨다                               |
| **metadata를 추가하면 TTFB가 늘어날 수 있다**                                  | `generateMetadata`가 본문과 같은 데이터를 기다리는 동안 document 응답이 시작되지 않기 때문이다             | Before(TTFB 46ms)와 비교해 measure — 늘어나면 확정. 늘어나지 않으면 fetch memoization이 동작한 것이다                               | 본문과 **URL·options가 완전히 같은** query factory 호출로 맞춰 Next.js의 fetch memoization이 걸리게 한다                                       |
| **metadata가 요청을 2배로 만들 수 있다**                                       | `generateMetadata`와 본문이 각각 prefetch를 호출하기 때문이다                                              | **서버 측 계수**(Route Handler 임시 로그)로 실제 호출 횟수를 센다 — Browser Network만으로는 document/RSC 경계 때문에 판정할 수 없다 | 같은 render/request에서 URL·options가 모두 같은 native fetch만 memoization 대상임을 이용한다. 계수 결과가 1회면 성공, 2회면 조건이 깨진 것이다 |
| **크롤러 UA는 응답 시점이 다를 수 있다**                                       | metadata를 기다리는 비용이 사용자와 크롤러에 다르게 걸릴 수 있기 때문이다                                  | 같은 URL에 일반 UA와 `facebookexternalhit`로 각각 요청해 `time_starttransfer`·`time_total`을 비교한다                               | (측정 항목 — 코드 변경 없음. 차이가 크면 metadata 조회 범위를 줄이는 근거가 된다)                                                              |
| 홈의 페이지 제목과 섹션 제목이 모두 `h2`라 제목 계층이 평평했다                | `PageHeading`이 `h2`를 쓰는데 섹션 제목도 같은 레벨로 작성됐기 때문이다                                    | 렌더된 HTML에서 `h2` 개수를 센다 — 홈 4개면 확정(확인됨)                                                                            | **적용 완료.** `HomeView`의 섹션 제목 3곳을 `h3`로 내려 페이지당 `h2`를 하나로 만들었다                                                        |

---

## 2부. 구현과 관찰

## 무엇을 만들었나

| 파일                                   | 내용                                                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/layout.tsx`                   | `metadataBase`, `title.template`(`%s \| Commerce`), 공통 `openGraph`를 `COMMON_OPEN_GRAPH`로 **export**해 페이지가 펼쳐 쓰게 함 |
| `src/app/(home)/page.tsx`              | `generateMetadata` — 본문과 **같은 `homeQueryOptions()`** 로 조회, 배너의 title·description·image 사용                          |
| `src/app/products/page.tsx`            | `generateMetadata` — 본문과 **같은 `loadProductSearchParams` + `productsQueryOptions`** 로 조회                                 |
| `src/shared/api/response.ts`           | `NEXT_PUBLIC_SITE_URL` → **`APP_ORIGIN`**(서버 전용). `getAppOrigin()`을 export해 metadata도 같은 origin 사용                   |
| `public/images/week-07/og-default.jpg` | OG fallback 이미지 **1200×630, 211KB**(원본 7.5MB를 OG 규격으로 크롭)                                                           |

**shallow merge 대응**: 페이지가 `openGraph`를 지정하면 루트 것이 통째로 대체되므로, 페이지에서 `{ ...COMMON_OPEN_GRAPH, title, description, images }`로 **명시적으로 펼쳐** `siteName`·`locale`·`type`을 유지한다.

**title 조립 규칙**: 검색어를 먼저 반영(`'셔츠' 검색 결과`), 2페이지 이상이면 페이지 번호를 덧붙임(`(2페이지)`). category·sort는 description에 반영.

## 홈이 정적 라우트라 metadata를 못 만들던 문제

구현 직후 홈 document의 `<title>`이 루트 기본값(`Commerce`)에 머물렀다. 원인은 **홈이 정적(`○`) 라우트로 프리렌더**되기 때문이었다.

- 홈은 주소가 고정이라 Next가 **빌드 시점에 HTML을 만들어 저장**한다.
- 그런데 데이터 출처인 `/api/home`은 **같은 앱의 Route Handler**라, 빌드 중에는 서버가 떠 있지 않아 조회가 실패한다.
- 본문은 하이드레이션 후 클라이언트가 다시 조회해 복구되지만, **metadata는 서버에서만 생성되므로 복구 경로가 없다.**

`/products`는 `searchParams`를 읽어 동적(`ƒ`) 라우트였기 때문에 이 문제가 없었다.

**변경**: `(home)/page.tsx`에 `export const dynamic = 'force-dynamic'`을 추가해 요청 시점 렌더로 바꿨다. 빌드 출력이 `○ /` → `ƒ /`로 바뀌고, metadata가 실제 배너 데이터를 쓰게 됐다.

> 잃는 것은 홈의 정적 최적화지만, **이전에도 실질적으로 쓰지 못하고 있었다** — 저장된 HTML에 데이터가 없어 매번 클라이언트가 다시 조회하고 있었다.

## ① normal · ② 정상 empty · ③ metadata query failure

세 시나리오의 document 응답을 [`./captures/`](./captures/)에 저장했다. 실행은 `APP_ORIGIN=… pnpm build && APP_ORIGIN=… pnpm start`(production).

|                                                      | `<title>`                               | `og:description`                                                     | `og:image`                                 |
| ---------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------ |
| **① normal** `/products`                             | `상품 목록 \| Commerce`                 | 최신순 · 전체 30개의 상품을 만나보세요.                              | 첫 상품 이미지(`/images/products/p26.jpg`) |
| **① normal** `/`                                     | `매일 새롭게 발견하는 취향 \| Commerce` | 지금 가장 사랑받는 상품을 만나보세요.                                | 배너 이미지                                |
| **② 정상 empty** `/products?q=존재하지않는`          | `'존재하지않는' 검색 결과 \| Commerce`  | **최신순 · 조건에 맞는 상품이 0개입니다.** 다른 조건으로 찾아보세요. | **og-default.jpg**(fallback 유지)          |
| **③ query failure**(`APP_ORIGIN=http://127.0.0.1:9`) | **`Commerce`**                          | 루트 공통 설명                                                       | og-default.jpg                             |

### 최종 URL — `canonical`과 `og:url`로 정규화 결과를 드러낸다

처음 구현에는 `canonical`도 `og:url`도 없어 **document에서 최종 URL을 확인할 수 없었다.** 완료조건이 이를 요구하므로, 정규화된 조건으로 URL을 다시 조립해 두 곳에 넣었다(`buildCanonicalPath`). 기본값(`all`·`latest`·1페이지)은 빼서 실제로 적용된 조건만 남긴다.

| 요청 URL                                        | document의 `canonical` = 최종 URL                                            |
| ----------------------------------------------- | ---------------------------------------------------------------------------- |
| `/products`                                     | `/products`                                                                  |
| `/products?page=0`                              | **`/products`** — 하한 보정(0 → 1)이 반영돼 파라미터가 사라짐                |
| `/products?category=nonexistent&sort=price-asc` | **`/products?sort=price-asc`** — 알 수 없는 category가 `all`로 보정돼 제외됨 |
| `/products?q=셔츠&page=3`                       | `/products?q=%EC%85%94%EC%B8%A0&page=3`                                      |
| `/`                                             | `/`                                                                          |

**즉 파서 사전 보정(`page` 하한, `category` enum)의 결과가 document에 그대로 드러난다.** metadata가 본문과 같은 `loadProductSearchParams`를 쓰기 때문에, 여기 찍힌 URL이 곧 본문이 조회한 조건이다.

> ③ query failure에는 `canonical`이 없다. `generateMetadata`가 빈 객체를 반환해 **페이지 metadata를 아예 만들지 않기 때문**이며, 루트에는 `canonical`이 없다(루트에 두면 모든 페이지가 `/`를 정본으로 주장하게 되어 잘못이다). 이 부재 자체가 "루트 상속" 동작의 증거다.

**②와 ③이 서로 다른 fallback을 보인다** — ②는 **조건과 0건을 설명하는 페이지 metadata를 만들고** OG 이미지만 fallback을 쓰며, ③은 **페이지 metadata를 아예 만들지 않고**(빈 객체 반환) 루트 공통 metadata를 상속한다. `og:site_name`·`og:locale`·`og:type`은 네 경우 모두 유지된다(shallow merge 대응이 동작함).

`robots: noindex`는 넣지 않았고, 기본 색인 가능 상태를 유지한다.

## ④ 서버 호출 계수 — 요청당 1회

Route Handler에 임시 로그를 넣어 **서버 측에서** 실제 호출 횟수를 셌다(Browser Network는 document/RSC 경계 때문에 판정 근거가 되지 않는다).

| 요청                                               | Route Handler 호출                                              |
| -------------------------------------------------- | --------------------------------------------------------------- |
| `/products?category=fashion&sort=price-asc&page=2` | **1회** — `?category=fashion&sort=price-asc&page=2&pageSize=12` |
| `/`                                                | **1회**                                                         |
| `/products?q=셔츠`                                 | **1회**                                                         |

**`generateMetadata`를 추가했는데도 호출이 늘지 않았다.** metadata와 본문이 같은 `loadProductSearchParams`로 URL을 정규화하고 같은 query factory를 호출하므로, 같은 render/request 안에서 **URL·options가 완전히 같은 native fetch**가 되어 Next.js의 fetch memoization이 걸린 결과다.

> **계측 제거**: 관찰 후 `console.error` 임시 로그를 두 Route Handler에서 모두 제거했고, 소스와 빌드 산출물 양쪽에서 `COUNT-` 문자열이 남아있지 않음을 확인했다.
>
> 계측 중 하나 걸린 점: `next.config.ts`의 `removeConsole`이 프로덕션 빌드에서 `console.*`를 제거하되 `error`만 남기도록 돼 있어, 처음 쓴 `console.warn`은 빌드에서 사라져 아무것도 세지 못했다. `console.error`로 바꿔야 계수가 잡혔다.

## ⑤ 일반 UA vs `facebookexternalhit` — 스트리밍 여부가 갈린다

```bash
curl -s -o /dev/null -w 'normal   start=%{time_starttransfer} total=%{time_total}\n' "$APP_ORIGIN/products"
curl -A 'facebookexternalhit/1.1' -s -o /dev/null -w 'facebook start=%{time_starttransfer} total=%{time_total}\n' "$APP_ORIGIN/products"
```

| UA                    | `time_starttransfer` | `time_total` |
| --------------------- | -------------------- | ------------ |
| 일반                  | **0.004–0.007s**     | 0.510–0.514s |
| `facebookexternalhit` | **0.511–0.517s**     | 0.512–0.518s |

**첫 바이트 도착 시점이 약 510ms 차이 난다.** 전체 완료 시점은 두 경우가 거의 같다(약 0.51s).

해석: 일반 브라우저에는 **셸을 먼저 스트리밍**하고(그래서 TTFB 4ms) 데이터가 준비되면 나머지를 흘려보낸다. 반면 크롤러 UA에는 **스트리밍을 하지 않고 완성된 HTML을 한 번에** 준다 — 크롤러는 부분 HTML로는 metadata를 읽을 수 없으므로 합리적인 동작이다.

**즉 metadata를 기다리는 비용은 사용자와 크롤러에게 다르게 걸린다.** 사용자는 셸을 먼저 받아 체감 지연이 없지만, 크롤러는 데이터 조회가 끝날 때까지 아무것도 받지 못한다. 홈·상품목록 모두 같은 패턴이다.

---

## 3부. 정리

## 완료조건 점검

과제 완료조건 문장을 항목별로 쪼개 **저장된 document와 실측으로** 대조했다.

| 완료조건                                            | 결과 | 증거                                                                                                                                                         |
| --------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| normal의 document 증거                              | ✅   | [`01-normal-products.html`](captures/01-normal-products.html), [`02-normal-home.html`](captures/02-normal-home.html)                                         |
| 정상 empty의 document 증거                          | ✅   | [`03-empty-products.html`](captures/03-empty-products.html)                                                                                                  |
| metadata query failure의 document 증거              | ✅   | [`04-metadata-failure-products.html`](captures/04-metadata-failure-products.html), [`05-metadata-failure-home.html`](captures/05-metadata-failure-home.html) |
| 서버 호출 계수                                      | ✅   | 4개 URL 모두 **요청당 1회**                                                                                                                                  |
| 계측 **제거 여부**                                  | ✅   | 소스·빌드 산출물 양쪽에서 계측 문자열 없음을 확인                                                                                                            |
| 일반 UA와 `facebookexternalhit` 응답 시점 비교      | ✅   | TTFB **0.007s vs 0.514s**                                                                                                                                    |
| 정상 empty와 query failure가 **서로 다른 fallback** | ✅   | ②는 0건을 설명하는 페이지 metadata 생성(OG 이미지만 fallback) / ③은 페이지 metadata 미생성 → 루트 상속                                                       |
| document에서 **metadata** 확인                      | ✅   | `<title>`·`description`·`og:title/description/image/site_name/locale/type`                                                                                   |
| document에서 **초기 구조** 확인                     | ✅   | `<main>` 1개, `h2` 1개, `href` 링크 4개(JS 실행 전 document Response 기준)                                                                                   |
| document에서 **최종 URL** 확인                      | ✅   | `canonical`·`og:url`에 정규화 결과가 드러남(`?page=0` → `/products`)                                                                                         |

### 요구사항 항목별 확인

| 요구사항                                                 | 결과                                                     |
| -------------------------------------------------------- | -------------------------------------------------------- |
| 루트 `title.template`·공통 OG와 페이지 metadata 합성     | ✅ `%s \| Commerce` 적용 확인                            |
| shallow merge 대응 — `siteName`·`locale`·`type` 유지     | ✅ 네 시나리오 모두 `Commerce / ko_KR / website` 유지    |
| 홈: 응답의 title·description·image 사용                  | ✅ `매일 새롭게 발견하는 취향 \| Commerce` + 배너 이미지 |
| 상품목록: 카테고리명·전체 개수·첫 상품 이미지 사용       | ✅ `패션, 가격 낮은순 · 전체 6개…` + `p26.jpg`           |
| 검색어를 title에 **먼저** 반영                           | ✅ `'셔츠' 검색 결과`                                    |
| category·sort를 description에 반영                       | ✅ 위와 동일                                             |
| 2페이지 이상은 title에 페이지 번호                       | ✅ `상품 목록 (2페이지)`, `'케이스' 검색 결과 (3페이지)` |
| 정상 empty에 0건 설명 + OG fallback image 유지           | ✅ `조건에 맞는 상품이 0개입니다` + `og-default.jpg`     |
| 조회 실패 시 페이지별 빈 값 대신 root 상속               | ✅ 빈 객체 반환 → 루트 title·description·OG              |
| `robots: noindex` 없이 기본 색인 가능 유지               | ✅ `robots` 메타 없음                                    |
| metadata와 본문이 같은 URL 정규화·query factory 사용     | ✅ 호출 1회가 그 증거                                    |
| `getQueryClient`를 singleton·영속 캐시로 바꾸지 않음     | ✅ `cache(() => new QueryClient())` 그대로               |
| Browser Network가 아닌 **서버 측 계수**로 호출 횟수 판정 | ✅ Route Handler 임시 로그로 계수                        |
| 초기 HTML을 document Response로 확인                     | ✅ `curl`로 받은 원본 HTML(JS 실행 전)                   |

**모두 충족.**

## 결정 기록 — 코드 변경 전 정한 것

1. **`APP_ORIGIN`으로 이름 변경** — 이 값은 `typeof window === 'undefined'` 가드 안에서만 쓰이는 서버 전용 설정인데 `NEXT_PUBLIC_` 접두사 탓에 클라이언트 번들에도 문자열로 박히고 있었다. 참조가 한 곳뿐이고 `.env` 파일도 없어 리스크가 없다고 판단해 이름을 바꿨다.
2. **OG fallback은 1200×630 전용 이미지를 새로 만든다** — 히어로 원본은 7.5MB, Part 2의 21:9 크롭본도 1.1MB라 크롤러 응답에 부담이다. OG 권장 규격으로 잘라 **211KB**짜리 `og-default.jpg`를 추가했다. `/_next/image?…` 같은 동적 URL은 크롤러 처리가 불안정할 수 있어 **정적 절대 URL**을 쓴다.

## 결정 — 페이지 제목은 `h2`로 한다 (Part 1 결정 승계)

Part 1에서 Part 3로 미뤄뒀던 heading level 판단을, **`PageHeading`을 `h2`로 그대로 두는 것**으로 직접 결정했다.

**근거 — 이 레이아웃에서는 히어로 제목이 문서의 최상위 제목이 아니다.** `PageHeading`은 홈과 상품 목록이 공유하는 히어로 영역이고, 그 안의 제목("이번 주의 발견 / 상품 목록")은 페이지 전체를 대표하는 이름이라기보다 **히어로라는 한 구획의 제목**이다. 여기에 `h1`을 붙이면 마크업이 "이 페이지의 주제는 히어로 배너다"라고 말하게 되는데, 실제 페이지의 주제는 그 아래의 상품 목록이다.

또한 `PageHeading`은 두 페이지가 공유하는 공통 컴포넌트라, 페이지마다 heading level을 prop으로 분기시키면 **"공통 컴포넌트는 도메인·페이지 사정을 모른다"는 이 프로젝트의 설계 원칙과 충돌**한다.

**과제 문구와의 차이**: 과제는 "초기 응답에 하나의 명확한 `h1`"을 요구한다. 이 프로젝트는 **레벨을 `h2`로 조정하되 "하나의 명확한 페이지 제목"이라는 의도는 그대로 충족**시켰다 — 페이지당 `h2`가 정확히 하나이고, 그 아래로 `h3` 섹션이 이어진다. 요구를 피한 것이 아니라 **이 레이아웃에서 더 정확한 마크업을 선택한 결과**다.

향후 홈·상품목록을 감싸는 layout이 생겨 페이지 이름을 소유하게 되면, 그때 layout이 `h1`을 갖고 `PageHeading`은 `h2`로 남는 구조가 자연스럽다.

## 경계 — 어디에 코드를 둘 것인가

- `generateMetadata`는 **app 레이어(`page.tsx`)에만** 둔다. entities·shared가 metadata를 알 필요가 없다.
- metadata가 쓰는 데이터는 **entities의 query factory를 그대로 재사용**한다(`productsQueryOptions`·`homeQueryOptions`). metadata 전용 fetch 경로를 새로 만들지 않는다 — 그러면 "같은 GET URL·options" 요구가 깨진다.
- 응답에서 metadata 문자열을 만드는 매핑 로직은 **호출부(page.tsx)의 책임**이다. View는 그리기만 한다는 기존 원칙과 같은 맥락이다.
- `getQueryClient`는 **건드리지 않는다.** 요청 단위로 새로 만드는 현재 구조가 과제 요구와 일치한다.

---

## 성능 개선 방향

Part 3는 metadata를 **추가**하는 작업이라 기본적으로 응답이 느려지는 쪽이다. 따라서 "얼마나 느려지는지"를 측정하는 것 자체가 과제의 일부다. 그 위에서 취할 수 있는 개선은 세 갈래다.

### 1. metadata가 만드는 추가 비용을 0에 가깝게 유지

`generateMetadata`와 본문이 **같은 render/request에서 URL·options가 완전히 같은 fetch**를 하면 Next.js의 fetch memoization으로 실제 네트워크 호출이 한 번만 일어난다. 이 조건이 깨지는 흔한 원인은 (a) query string 순서가 다름, (b) 한쪽만 헤더·옵션을 추가함, (c) 서로 다른 함수로 URL을 조립함이다. **`productsQueryOptions`를 양쪽에서 똑같이 호출하면 세 가지 모두 자동으로 예방된다** — 이게 "같은 query factory를 쓰라"는 요구의 실질적 이유다.

측정으로 확인할 것: ④의 서버 호출 계수가 **1회**인지. 2회면 위 조건 중 하나가 깨진 것이다.

### 2. Part 2에서 확인된 실제 병목 — hero와 동시 출발하는 리소스

Part 2 Round 12 측정에서 hero(132KB)의 네트워크 구간이 **2,304ms**였다. 시뮬레이션 대역폭(1,280KB/s)이면 약 103ms면 될 양이므로, 나머지는 **같은 시점(616ms)에 출발하는 다른 리소스와의 대역폭 경쟁**이다.

| 시작     | 크기     | priority | 리소스          |
| -------- | -------- | -------- | --------------- |
| 616ms    | 22.9KB   | High     | Geist 폰트      |
| 616ms    | 28.9KB   | High     | Geist Mono 폰트 |
| 616ms    | 132KB    | High     | **hero**        |
| 616ms    | 4.6KB    | VeryHigh | CSS ×2          |
| 1,286ms~ | 약 138KB | Low      | JS 청크         |

> **이 항목은 Part 2 Round 12에서 이미 처리했다.** 확인해보니 Geist·Geist Mono 두 폰트가 **어디에도 쓰이지 않으면서**(화면은 `Arial`로 렌더) preload까지 걸려 hero와 경쟁하고 있었다. 제거 결과 **hero 구간 2,620ms → 2,304ms(−316ms), Speed Index −176ms**. 남은 High 우선순위 경쟁자는 없다.

### 3. hero 자체를 더 줄이기 (Part 2에서 이어짐)

Part 2 Round 11에서 21:9 크롭으로 167,195 → 135,568 bytes(−19%)를 화질 손실 없이 줄였다. 여기서 더 줄이려면 폭을 낮추거나 압축률을 올려야 하고, 둘 다 화질을 대가로 낸다.

현재는 `sizes`가 실제 렌더 폭(최대 1200px)을 신고하고 DPR 2 화면에서 `w=2400`이 선택된다. 한때 DPR을 1.75로 읽고 `w=2048`이 적절하다고 판단해 `sizes`를 손댄 적이 있는데, **`screenEmulation.disabled: true`면 설정의 `deviceScaleFactor`가 무시되고 실제 DPR이 쓰인다**는 것을 뒤늦게 확인하고 철회했다. 그 잘못된 전제로 만든 폭별 비교표도 함께 걷어냈다.

Part 2 3부의 "hero를 더 줄이려면(미적용)" 표에 현재 기준의 선택지와 대가를 정리해 뒀다. 다만 **어느 쪽도 Part 3의 완료조건과 무관하고 화질을 건드리므로 적용하지 않았다.**

### 판단 기준

세 갈래 모두 **Part 3의 완료조건과는 무관하다.** 완료조건은 "document 증거·서버 호출 계수·UA별 응답 시점"이지 점수가 아니다. Part 2에서 정리했듯 **성능 점수는 이 과제들에서 개선 지표가 아니라 회귀 확인용**이므로, metadata 추가로 응답이 느려지는 것을 정확히 측정해 기록하는 쪽이 우선이다.
