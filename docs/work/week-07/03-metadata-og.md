# 7주차 3단계 — 동적 metadata와 Open Graph

> **작성 안내**
> 값이 `-` 인 항목은 아직 측정·관찰하지 않은 자리다. 실측 후 채운다.
> 재현 조건은 [measurement-conditions.md](./measurement-conditions.md) 따른다. `APP_ORIGIN` build/runtime 동일 값 조건은 그 문서의 조건표를 그대로 따르되, 이 단계에서만 필요한 불통 origin 재현은 아래 명령을 쓴다.

---

## Before baseline (구현 전 실측)

`generateMetadata` 도입 전, `metadata-design.md` §0에서 실측한 값. 이 단계의 코드 변경이 어떤 비용 위에 얹히는지 판단하는 기준선이다.

**측정 조건**

- SHA: `44e14915` + 미커밋 변경(`commerce.css` 클램프, `measurement-and-decisions.md`)
- `APP_ORIGIN=http://127.0.0.1:3001 pnpm build && pnpm start -p 3001` (production)
- 도구: `curl -w time_starttransfer/time_total`, 로컬 루프백, throttling 없음
- 이 시점 상태: `generateMetadata` 없음, 루트 정적 `metadata`만 존재

**API 지연 계약**

| 엔드포인트                          | total (3회)              |
| ------------------------------------ | ------------------------- |
| `/api/home` (scenario 없음)          | 0.512 / 0.508 / 0.508 s   |
| `/api/products?…&scenario=slow`      | 1.508 / 1.504 / 1.507 s   |

`getProductList`가 요청 URL에 항상 `scenario=slow`를 붙이므로 목록은 상시 1.5초다.

**document TTFB (5회)**

| 경로        | `time_starttransfer` raw (5회)                          | 중앙값    | 범위          |
| ----------- | --------------------------------------------------------- | --------- | ------------- |
| `/`         | 0.571 / 0.522 / 0.520 / 0.520 / 0.522                     | 0.522 s   | 0.520–0.571   |
| `/products` | 0.0099 / 0.0063 / 0.0070 / 0.0056 / 0.0052                 | 0.0063 s  | 0.005–0.010   |

`total`은 `time_starttransfer`와 1ms 이내 차이 — 스트리밍 후속 chunk가 사실상 없다.

**초기 HTML (baseline)**

| 항목          | `/`                                                                 | `/products`        |
| ------------- | -------------------------------------------------------------------- | ------------------- |
| `<title>`     | `Commerce`                                                            | `Commerce` (동일)   |
| `description` | 루트 값 그대로                                                        | 루트 값 그대로       |
| `og:*`        | 없음                                                                   | 없음                 |
| `h1`          | **없음** (h2부터: 매일 새롭게 발견하는 취향 / 카테고리 / 인기 상품 / 신상품) | `상품 목록` 1개      |

**UA 비교 (baseline — 아직 UA 분기 없음)**

| UA                    | `time_starttransfer` (3회)              | `time_total` (3회)                     |
| --------------------- | ------------------------------------------ | ---------------------------------------- |
| 일반 document         | 0.0059 / 0.0049 / 0.0054 s                 | 0.0063 / 0.0053 / 0.0058 s                |
| `facebookexternalhit` | 0.0059 / 0.0049 / 0.0054 s (같은 값)        | 0.0063 / 0.0053 / 0.0058 s (같은 값)      |

UA 분기가 없는 지금은 두 UA가 같은 경로로 처리되어 같은 값이 나온다. 이 비교는 `generateMetadata` 도입 후 다시 재야 의미가 생긴다.

**baseline이 말하는 비용 구조**

두 페이지의 비용 구조가 다르다.

- **목록** — 셸이 6ms에 나간다. 본문을 클라이언트 `useQuery`가 소유해서 서버가 아무것도 기다리지 않기 때문이다. `generateMetadata`가 `productQueries.list`를 await하면 TTFB가 6ms → 약 1506ms로, **없던 1.5초를 새로 만든다.** 본문은 브라우저가 따로 fetch하므로 request 범위 fetch memoization의 수혜도 없다 — Route Handler 호출이 서버 1회 + 브라우저 1회로 실제로 늘어난다.
- **홈** — 셸이 이미 522ms 막혀 있다. `HomePage`가 루트에서 `await queryClient.prefetchQuery(homeQueries.detail())`를 하기 때문이고, 522ms는 `/api/home`의 500ms와 맞는다. `generateMetadata`가 같은 request 안에서 같은 URL·options로 `/api/home`을 부르면 native fetch memoization 대상이 되어 순증이 0에 가까울 수 있다 — **구현 후 확인 결과 이 가설이 맞았다**(호출 1회, TTFB 순증 ≈ 0. 아래 "홈 호출 횟수 재조사" 참고).

부수적으로 확인된 것: **홈에 `h1`이 없다.** 아래 접근성 최소 회귀 항목과 직접 걸린다.

---

## 3️⃣ 동적 metadata와 Open Graph

> 측정 조건: SHA 기준 브랜치 최신 상태(3단계 구현 후, 미커밋) + `commerce.css` 클램프. `APP_ORIGIN=http://127.0.0.1:3001 pnpm build && pnpm start -p 3001` (production, 로컬 루프백). 도구는 `curl`.

**합성 구조**

| 항목                                                      | 내용                                                                                                                                                                                                                             |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 루트 `app/layout.tsx`의 title template·공통 `openGraph`   | `src/_app/RootLayout.tsx`에 구현. `title: { default: 'Commerce', template: '%s \| Commerce' }`, `openGraph: { ...commonOpenGraph, title: SITE_NAME, description: SITE_DESCRIPTION, images: [OG_FALLBACK_IMAGE] }`. `metadataBase`는 `process.env.APP_ORIGIN`(없으면 `http://localhost:3000`으로 폴백 — CI가 환경변수 없이 빌드하므로 필요). `robots`는 미설정 |
| `app/page.tsx`의 `generateMetadata` 확인 내용              | `generateHomeMetadata`(`src/_pages/home/api/generateHomeMetadata.ts`)를 `generateMetadata`로 re-export. `homeQueries.detail()`(본문 prefetch와 동일 query factory)로 조회 → `title/description/openGraph` 구성, 실패 시 `{}` |
| `app/products/page.tsx`의 `generateMetadata` 확인 내용     | `generateProductListMetadata`(`src/_pages/product-list/api/generateProductListMetadata.ts`)를 `generateMetadata`로 re-export. `createLoader(productListParsers)`로 `searchParams` 파싱 → `productQueries.list(filters)`로 조회 → title/description/OG 구성, 실패 시 `{}` |
| shallow merge에서 `siteName`·`locale`·`type`을 유지한 방법 | 홈·목록 모두 `openGraph: { ...commonOpenGraph, title, description, images }` 형태로 `commonOpenGraph`(`src/shared/config/siteMetadata.ts`)를 펼친 위에 페이지 필드를 얹음. 실측(아래 초기 HTML)에서 `og:site_name`·`og:locale`·`og:type`이 홈·목록 모두에 남아있음을 확인 |

**title·description 규칙**

| 조건            | 반영 위치                | 구현 내용 |
| --------------- | ------------------------ | --------- |
| 검색어          | title에 먼저 반영        | `filters.q.trim()`이 있으면 `'검색어' 검색 결과`, 없으면 `상품 목록` |
| category · sort | description에 반영       | `[검색어?, 카테고리명, 정렬라벨, 총 N개].join(' · ')`. 카테고리명은 응답 `categories`에서 조회(`all`은 `전체` 고정), 정렬 라벨은 `SORT_LABELS`(model/productListConstants.ts, 화면 select와 공유) |
| 2페이지 이상    | title에 페이지 번호 반영 | `filters.page > FIRST_PAGE`면 `(N페이지)`를 title 끝에 추가 |

실측(production, `q=가방&category=fashion&sort=price-asc`): `title="'가방' 검색 결과 \| Commerce"`, `description="'가방' · 패션 · 가격 낮은순 · 총 0개"`.
실측(기본, q없음·all·최신순): `title="상품 목록 \| Commerce"`, `description="전체 · 최신순 · 총 30개"`.

**데이터 소스 일치**

| 페이지    | metadata에 쓰는 응답 필드                                          | 구현 내용 |
| --------- | ------------------------------------------------------------------ | --------- |
| 홈        | 응답의 title · description · image                                 | `home.banner.title` / `home.banner.description` / `home.banner.image` (`homeQueries.detail()` 응답, `HomeSection`이 렌더에 쓰는 것과 동일 객체) |
| 상품 목록 | 정규화한 URL 조건 + 응답의 카테고리명 · 전체 개수 · 첫 상품 이미지 | `productQueries.list(filters)` 응답의 `categories`(카테고리명 조회) · `totalCount` · `products[0]?.image`(없으면 `OG_FALLBACK_IMAGE`) |

| 항목                                                                        | 내용 |
| --------------------------------------------------------------------------- | ---- |
| metadata와 본문이 같은 URL 정규화·query factory·GET URL·options를 쓰는 지점 | 홈: 둘 다 `homeQueries.detail()`. 목록: 둘 다 `createLoader(productListParsers)`로 파싱한 `filters`를 `productQueries.list(filters)`에 넘김 — 내부에서 `toProductListQuery()`로 동일 정규화(q trim+소문자, page clamp) 후 동일 GET URL 조립 |
| 서버 `getQueryClient()`가 호출마다 새 인스턴스를 만드는지                   | 그렇다(`src/shared/api/getQueryClient.ts`: `() => new QueryClient(...)`). metadata와 본문은 TanStack Query 캐시를 공유하지 않는다 |
| request 범위 native fetch memoization의 적용 범위                           | **홈은 적용됨**(`/api/home` 요청당 1회 — 아래 서버 호출 계수 참고). `generateMetadata`와 페이지 렌더가 같은 memoization 스코프를 공유한다. **목록은 적용 대상이 아니다** — `productQueries.ts:20`이 `queryFn: ({ signal }) => getProductList(query, signal)`로 `AbortSignal`을 넘겨 `apiFetch(..., { signal })`가 되는데, Next.js 문서상 signal을 넘긴 fetch는 memoization에서 opt-out된다. 지금은 목록의 서버 측 호출자가 metadata 하나뿐(2단계에서 server prefetch 철회)이라 중복이 드러나지 않지만, 목록에 server prefetch를 되살리면 이 signal 때문에 2회로 늘어난다 |

**재현과 증거**

| 상황                                         | 확인한 증거                                                                                                     | 결과 |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---- |
| normal                                       | production document 응답 + 초기 HTML (title · description · Open Graph · 하나의 `h1` · 페이지 설명 · 주요 링크) | `/`: `<title>매일 새롭게 발견하는 취향 \| Commerce</title>`, og:* 전체 포함, `<h1>이번 주 추천 상품</h1>`(셸, Suspense 밖). `/products`: `<title>상품 목록 \| Commerce</title>`, `<h1>상품 목록</h1>`. 둘 다 `og:site_name/locale/type` 유지 |
| 정상 empty (성공 + 0건)                      | URL 조건, 0건을 설명하는 title·description, Open Graph fallback image 유지                                      | `q=존재하지않는상품명`: `<title>'존재하지않는상품명' 검색 결과 \| Commerce</title>`, `description="'존재하지않는상품명' · 전체 · 최신순 · 총 0개"`, `og:image`가 `OG_FALLBACK_IMAGE`(hero-responsive-1200w.jpg)로 유지됨 |
| metadata query failure                       | `APP_ORIGIN`을 닿지 않는 origin으로 두고 build·runtime 동일 실행 → root 공통 metadata 상속 여부                 | `/`, `/products` 모두 `<title>Commerce</title>` + 루트 `description`/`og:*`로 동일하게 폴백. 페이지별 title·description은 남지 않음(빈 값이 아니라 root 값 그대로) |
| 기본 색인 가능 상태 (`robots: noindex` 없음) | 초기 HTML에 `<meta name="robots">` 존재 여부                                                                    | `/`, `/products` 모두 `robots` 메타 태그 없음 → 기본 색인 가능 상태 유지 |

```bash
APP_ORIGIN=http://127.0.0.1:9 pnpm build
APP_ORIGIN=http://127.0.0.1:9 pnpm start
```

**서버 호출 계수**

| 항목                                     | 내용 |
| ---------------------------------------- | ---- |
| 계수 방법 (Browser Network 아님)         | `app/api/home/route.ts`, `app/api/products/route.ts`의 `GET` 진입부에 `console.log('[CALL-COUNT] ...', request.nextUrl.href)`를 임시로 추가 → `curl`로 각 페이지 1회 요청 → 서버 stdout 로그 확인. 재조사에서는 요청 직전/직후 로그 줄 수를 차분해 요청 1회당 증가분만 세도록 방법을 강화했다(누적 로그를 통째로 읽지 않게) |
| 동일 slow Route Handler 호출 횟수 — 홈   | **1회.** `generateHomeMetadata`의 `fetchQuery`와 `HomePage`의 `prefetchQuery`가 서로 다른 QueryClient를 쓰지만, 최종 native fetch가 같은 URL·options라 request 범위 memoization으로 합쳐진다. 설계 문서의 "순증 0에 가까울 수 있음" 가설이 **실측으로 확인됨** — `generateMetadata` 도입 전 baseline TTFB 522 ms와 도입 후 521.9 ms가 같다(순증 ≈ 0)<br>※ 이 항목은 재조사로 정정됐다. 최초 계수에서 "2회"로 기록했으나 재현되지 않았다 — 상세는 아래 "홈 호출 횟수 재조사" 참고 |
| 동일 slow Route Handler 호출 횟수 — 목록 | **1회**. `/api/products`는 metadata에서만 호출됨(본문은 2단계 이후 클라이언트 `useQuery`가 소유해 서버에서 호출하지 않음 — curl은 JS를 실행하지 않으므로 브라우저 쪽 호출은 이 계수에 포함되지 않음) |
| 임시 계측 제거 확인                      | 완료. `git diff app/api/home/route.ts app/api/products/route.ts`로 원상 복구 확인(diff 없음) |

**홈 호출 횟수 재조사** (SHA `e3fdf8e5`, `APP_ORIGIN=http://127.0.0.1:3001 pnpm build && pnpm start -p 3001`, 4단계 측정 서버와 별도 포트로 격리)

최초 계수에서 홈을 "2회"로 기록했으나 재현되지 않아 다시 조사했다. 결론은 **1회이고 memoization은 정상 동작한다.** 근거 5개가 모두 일치한다.

| # | 확인 | 결과 |
| --- | --- | --- |
| 1 | Route Handler 계수 — 일반 UA·브라우저 UA·`facebookexternalhit`·`RSC: 1` 헤더·반복 요청 | 5개 조건 모두 1회 |
| 2 | dev 서버(`pnpm dev`)에서도 계수 (렌더 중복 가능성 배제) | 1회 |
| 3 | 프로브 실험 — TanStack Query를 우회해 `generateMetadata`와 `HomePage`에서 동일 URL(`/api/home?probe=cross`)을 raw `fetch`로 1회씩 호출 | 1회 → 두 경계가 memoization 스코프를 **공유**함을 직접 확인 |
| 4 | 통제 — `generateMetadata`가 조용히 실패해 호출이 1회인 것은 아닌지 | 초기 HTML `<title>매일 새롭게 발견하는 취향 \| Commerce</title>`가 API 응답(`home.banner.title`)에서 생성됨. 즉 실제로 fetch했는데도 로그는 1줄 |
| 5 | TTFB 산술 — `/api/home` 단독 505~506 ms vs `/` 문서 TTFB 519~528 ms | 직렬 2회면 ≥1,010 ms여야 하는데 1회분(506 ms) + 오버헤드 ~16 ms와 일치 |

최초 "2회"의 발생 경위는 특정하지 못했다. 재현 시도한 조건(production·dev, UA·요청 유형 5종, 콜드·워밍)에서 모두 1회였고, `homeQueries.ts`는 week-06 커밋 이후 수정된 적이 없어 "당시엔 `AbortSignal`을 넘겼다"는 가능성도 배제된다. 누적 로그를 두 번 이상의 요청에 걸쳐 읽었을 가능성이 가장 유력하나 원본 로그가 남아있지 않아 확증하지 못했다.

참고로 Next.js `fetch` 문서의 memoization 적용 대상 목록은 "Server Components, layouts, pages, `generateStaticParams`, `generateViewport`"로 `generateMetadata`를 명시하지 않는다. 그러나 위 3번 프로브 실험에서 실제로는 스코프가 공유됨을 확인했다.

**document / RSC 경계와 최종 URL**

| 항목                                        | 내용 |
| ------------------------------------------- | ---- |
| Network에서 확인한 document 요청과 RSC 요청 | `curl -I "$O/products"` → `Content-Type: text/html; charset=utf-8`(document). `curl -I -H "RSC: 1" "$O/products"` → `Content-Type: text/x-component`(RSC payload) |
| 최종 URL과 metadata에 반영된 URL 조건 대조  | `curl -H "RSC: 1" "$O/products?category=fashion"`의 RSC payload 안에 `"패션 · 최신순 · 총 6개"`가 그대로 포함 — RSC 응답도 요청 시점 URL(`category=fashion`)의 metadata를 반영함. query failure 서버에서 동일 요청 시 RSC payload에 `"Commerce"`만 포함(페이지별 값 없음) |

**초기 HTML 확인 방법** — document Response(`curl`, JavaScript 미실행)

**응답 시점 비교 (일반 UA vs `facebookexternalhit`)**

```bash
curl -s -o /dev/null -w 'normal start=%{time_starttransfer} total=%{time_total}\n' "$APP_ORIGIN/products"
curl -A 'facebookexternalhit/1.1' -s -o /dev/null -w 'facebook start=%{time_starttransfer} total=%{time_total}\n' "$APP_ORIGIN/products"
```

| UA                    | `time_starttransfer` (3회)                | `time_total` (3회)                        |
| --------------------- | ------------------------------------------- | -------------------------------------------- |
| 일반 document         | 0.026 / 0.010 / 0.012 s                     | 1.535 / 1.514 / 1.519 s                       |
| `facebookexternalhit` | 1.525 / 1.515 / 1.519 s                     | 1.526 / 1.515 / 1.520 s                       |

참고로 `/`(홈)는 두 UA 모두 `start`≈`total`≈0.52s로 차이가 없었다(이미 서버가 통째로 기다리는 경로라 UA 분기의 여지가 없음).

**해석 및 metadata가 데이터를 기다린 비용에 대한 판단**

목록에서 예상 밖의 동작이 관측됐다. Next.js는 일반 UA에는 **streaming metadata**를 적용해 `<head>`가 완성되기 전에 문서 셸을 먼저 흘려보낸다 — `time_starttransfer`가 baseline과 거의 같은 11~26ms로 나온 이유다. 그런데 `time_total`은 1.5s대로, 응답이 완전히 끝나기까지는 결국 느린 metadata 조회를 기다린다(연결이 닫히지 않고 뒤늦게 `<title>`·`<meta>`를 스크립트로 주입하는 chunk를 붙여 보냄). 반면 `facebookexternalhit`처럼 알려진 crawler UA는 **처음부터 응답을 보류**한다 — TTFB 자체가 1.5s대로 늦어진다. 즉 Next는 이 UA를 감지해 "크롤러는 JS를 실행하지 못할 수 있으니 완성된 `<head>`를 한 번에 준다"는 전략을 쓰는 것으로 보인다.

이게 이 프로젝트의 목록 metadata 설계에 주는 의미는, "브라우저 사용자는 셸을 빨리 받지만 문서가 완전히 끝날 때까지는 여전히 1.5초를 들고 있다"는 것 — TTFB만으로는 이 비용이 감춰진다. crawler(SNS 링크 미리보기 등)는 그 1.5초를 응답 지연으로 고스란히 받는다. 홈은 이런 분기가 없다 — 셸 자체가 이미 `await prefetchQuery`로 블로킹되어 있어 metadata 스트리밍이 낄 자리가 없기 때문이다.

**접근성 최소 회귀**

| 항목                                                | 내용 |
| --------------------------------------------------- | ---- |
| 주요 콘텐츠·탐색·상품 영역의 역할이 드러나는 마크업 | 기존 구조 유지(변경 없음). 홈: `<main class="page-container">` 안에 `<h1>`, hero `<section aria-labelledby>`, 카테고리/인기/신상품 `<section>`. 목록: `<main>` 안 `<h1>상품 목록</h1>`, 검색 결과 `<section aria-label="상품 검색 결과">`, 페이지 이동 `<nav aria-label="페이지 이동">` |
| 주요 이동이 `href` 링크인지                         | 기존 구조 유지(변경 없음) — 카테고리 링크(`<Link href="/products?category=...">`), 헤더 내비게이션 모두 실제 `href` |
| 의미 있는 이미지의 대체 텍스트                      | 기존 구조 유지(변경 없음) — 상품 카드 `alt`는 상품명, hero 이미지는 배경 장식용으로 `alt=""` |
