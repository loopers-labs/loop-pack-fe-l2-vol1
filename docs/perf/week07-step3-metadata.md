# 7주차 3단계 — 동적 metadata와 Open Graph

<!-- AI 초안 — 구현·검증 자동화, 검토 필요 -->

## 구조

| 파일 | 역할 |
| --- | --- |
| `shared/api/base-url.ts` | `apiUrl()` — 서버는 `APP_ORIGIN` 절대 URL, 클라이언트는 상대 경로. **`APP_ORIGIN`이 필요한 이유가 여기다**: `generateMetadata`·서버 prefetch가 자신의 Route Handler를 부르려면 절대 origin이 필요하다 |
| `_pages/products/model/productFilterParsers.ts` | **URL 정규화 단일 소스** — nuqs 파서를 `nuqs/server`에서 정의, 클라 훅(`useProductFilters`)과 서버(`loadProductFilters`)가 같은 파서 공유. 잘못된 값은 양쪽에서 같은 기본값으로 정규화 |
| `app/get-query-client.ts` | 호출마다 **새 QueryClient** (과제 계약 — singleton·영속 캐시 금지) |
| `app/shared-metadata.ts` | `sharedOpenGraph`(siteName·locale·type)·fallback OG 이미지 — shallow merge 대응 공통 객체 |
| `app/layout.tsx` | `metadataBase`(=APP_ORIGIN)·title template·루트 공통 openGraph |
| `app/(commerce)/page.tsx` | `generateMetadata` + 본문 prefetch + `HydrationBoundary`. `force-dynamic` — metadata가 홈 응답을 쓰므로 요청 시점 렌더 |
| `app/(commerce)/products/page.tsx` | searchParams 정규화 → 같은 query factory로 metadata·본문 prefetch |

metadata와 본문은 **같은 query factory**(`homeQueries.home()`·`productQueries.list(filters)`)와 같은 정규화를 쓰므로 같은 GET URL·options를 만든다.

## document 증거 (production, `APP_ORIGIN=http://localhost:3000`)

**normal (홈)**: `<title>매일 새롭게 발견하는 취향 | Commerce</title>` — 배너 title + 루트 template 합성. `og:site_name=Commerce`·`og:locale=ko_KR`·`og:type=website` 유지(공통 객체 스프레드로 shallow merge에도 생존), `og:image=http://localhost:3000/images/products/p6.jpg`(metadataBase로 절대화).

**목록 title·description 규칙**:

| URL | title | description |
| --- | --- | --- |
| `?q=셔츠` | `"셔츠" 검색 결과 \| Commerce` (검색어 우선) | — |
| `?page=2` | `상품 목록 · 2페이지 \| Commerce` (2페이지 이상 번호) | — |
| `?category=fashion&sort=popular` | — | `패션 카테고리 · 인기순 — 상품 6개` (category·sort는 description) |

**정상 empty (`?q=zzz`)**: title `"zzz" 검색 결과`, description `…조건에 맞는 상품이 0개입니다.`, **og:image는 fallback 유지**(`p6.jpg` — 16KB 배너 정적 이미지. 처음엔 hero 원본이었으나 크롤러에 7.5MB를 주는 모순이라 교체).

**metadata query failure** (`APP_ORIGIN=http://127.0.0.1:9`로 build+start — build 실패 없음): 홈·목록 모두 `<title>Commerce</title>` + 루트 description — **페이지별 빈 값이 아니라 root 공통 metadata 상속**. 정상 empty와 서로 다른 fallback임을 확인.

**JS 실행 전 초기 HTML** (curl = JS 없음): `<h1>상품 목록</h1>`, `aria-label="주요 메뉴"`(nav)·`"상품 검색 결과"`(section), **상품 카드와 aria-label까지 SSR** — 목록이 동적 렌더로 전환되며 초기 HTML에 실제 콘텐츠가 담긴다. `robots: noindex` 없음(기본 색인 가능).

## 서버 호출 계수 (요구: Browser Network가 아닌 서버 측 계수)

`api/home/route.ts`에 임시 `console.log` 계수 추가 후 관측, **관측 후 제거(`git checkout`)**:

| 행동 | Route Handler 실제 호출 |
| --- | --- |
| 홈 document 1회 요청 | **1회** |
| 홈 document 2회째 | +1회 (누적 2) |

코드상 fetch는 요청당 2번이다 — `generateMetadata`의 새 QueryClient와 본문 prefetch의 새 QueryClient가 각각 `fetchQuery`. 그런데 실제 호출이 1회인 이유: **같은 render/request 안에서 URL·options가 같은 native fetch는 Next가 memoize**한다. QueryClient를 공유하지 않아도 중복이 없고, 문서 2회째에 +1인 것은 memoization이 request 범위라는 증거다.

## UA별 응답 시점 (`time_starttransfer` / `time_total`, 2회씩)

```
normal    start=0.513s total=0.514s   |   start=0.513s total=0.513s
facebook  start=0.513s total=0.514s   |   start=0.507s total=0.508s
```

**차이 없음.** 이 앱에서는 본문 prefetch가 metadata와 같은 fetch를 공유하므로, 크롤러든 일반 UA든 문서 첫 바이트가 같은 API 완료(mock 500ms)를 기다린다 — **metadata만의 추가 대기 비용은 0**이다.

## 비용 판단 (metadata가 데이터를 기다리는 값)

- **비용**: 홈이 정적(○)→동적(ƒ)이 되어 document TTFB가 ~1ms → ~510ms (API 500ms + 렌더). 4단계에서 0단계 조건으로 재측정해 FCP·LCP 영향을 수치로 비교한다.
- **이점**: ① 크롤러·공유 미리보기가 실제 데이터 기반 title·description·image를 받는다 ② 본문 prefetch + hydration으로 클라이언트의 첫 API 왕복이 사라져 직접 진입 시 스켈레톤 없이 목록이 즉시 뜬다(브라우저 확인: `?category=fashion` 진입 → 카드 6개 즉시) ③ 초기 HTML에 실제 콘텐츠 — JS 실패 환경에서도 의미 전달.

## 회귀 확인

`pnpm check` 41/41 통과. 브라우저: 직접 진입 hydration(스켈레톤 스킵)·필터 변경·URL 동기화·배지 동작 확인. 2단계 상태 표는 유효하다 — 스켈레톤(①)은 이제 캐시 없는 **클라이언트 키 변경**에서 나타나고, 직접 진입은 서버 prefetch가 대신한다.
