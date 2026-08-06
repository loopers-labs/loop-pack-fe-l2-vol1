# Week 07 Step 3 Metadata After

## 범위

이 문서는 3단계 요구사항인 App Router metadata, Open Graph 합성, document 응답 비용, 실패 fallback, 서버 Route Handler 호출 계수를 다룬다.

관련 코드 커밋:

- `ebd6513` `feat: 3단계 페이지 metadata 구성 추가`

## 구현 기준

- Root metadata는 `src/app/layout.tsx`에서 `metadataBase`, title template, 공통 description, 공통 Open Graph를 제공한다.
- 공통 Open Graph 필드는 `src/shared/metadata/commerceMetadata.ts`에서 관리한다.
- 페이지 metadata는 root `openGraph` shallow merge 손실을 피하기 위해 `siteName`, `locale`, `type`을 포함한 공통 객체를 명시적으로 펼쳐 쓴다.
- Home metadata는 본문 prefetch와 같은 `homeQueries.main()`으로 조회한 banner `title`, `description`, `image`를 사용한다.
- Products metadata는 본문 prefetch와 같은 `productQueries.list()`와 `loadProductListSearchParams()`로 정규화한 URL 조건을 사용한다.
- metadata 조회가 실패하면 페이지별 빈 title/description을 만들지 않고 `{}`를 반환해 root metadata를 상속한다.
- 서버 fetch URL은 `INTERNAL_API_BASE_URL -> APP_ORIGIN -> http://localhost:3000` 순서로 origin을 정한다.
- 서버 `getQueryClient()`는 기존처럼 호출마다 새 QueryClient를 만들며, metadata와 본문 캐시 공유를 위해 singleton으로 바꾸지 않았다.
- `robots: noindex`는 추가하지 않았다.

## 저장 자료

| 자료                                                                               | 용도                                      |
| ---------------------------------------------------------------------------------- | ----------------------------------------- |
| [home-normal-document.html](./home-normal-document.html)                           | Home normal document 응답                 |
| [products-normal-document.html](./products-normal-document.html)                   | Products normal document 응답             |
| [products-empty-document.html](./products-empty-document.html)                     | Products 정상 empty document 응답         |
| [products-query-failure-document.html](./products-query-failure-document.html)     | metadata query failure document 응답      |
| [products-slow-call-count-document.html](./products-slow-call-count-document.html) | slow 호출 계수 관찰 시 document 응답      |
| [document-inspection.txt](./document-inspection.txt)                               | document metadata와 초기 구조 추출 결과   |
| [server-call-count.log](./server-call-count.log)                                   | 임시 서버 로그 기반 Route Handler 호출 수 |
| [curl-timing.txt](./curl-timing.txt)                                               | normal UA와 facebookexternalhit 응답 시간 |
| [query-failure-reproduction.txt](./query-failure-reproduction.txt)                 | query failure 재현 절차와 결과            |

## Normal Document

실행 조건:

```bash
APP_ORIGIN=http://localhost:3001 pnpm build
APP_ORIGIN=http://localhost:3001 PORT=3001 pnpm start
```

### Home

저장 파일:

- [home-normal-document.html](./home-normal-document.html)
- [home-normal-headers.txt](./home-normal-headers.txt)

관찰 결과:

| 항목           | 값                                                  |
| -------------- | --------------------------------------------------- |
| title          | `매일 새롭게 발견하는 취향 \| Commerce`             |
| description    | `지금 가장 사랑받는 상품을 만나보세요.`             |
| og:title       | `매일 새롭게 발견하는 취향`                         |
| og:description | `지금 가장 사랑받는 상품을 만나보세요.`             |
| og:image       | `http://localhost:3001/images/products/p6.jpg`      |
| 주요 이동 링크 | `Commerce`, `상품` href 링크                        |
| Hero 설명      | banner title과 description이 document 응답에 포함됨 |

초기 제공 코드에서 Home hero heading은 `h2`였고, 이번 단계의 핵심 변경 범위는 metadata와 document 응답 비용 확인이다. 이전 Home LCP 측정의 DOM 구조도 유지하기 위해 heading level은 바꾸지 않았다. Products 목록 페이지는 document 응답에서 `h1`과 상품 결과 영역을 확인했다. Home heading level 변경은 별도 접근성 개선 후보로 남긴다.

### Products

저장 파일:

- [products-normal-document.html](./products-normal-document.html)
- [products-normal-headers.txt](./products-normal-headers.txt)

관찰 결과:

| 항목           | 값                                               |
| -------------- | ------------------------------------------------ |
| title          | `상품 목록 \| Commerce`                          |
| description    | `전체 카테고리의 최신순 상품 30개를 확인하세요.` |
| og:title       | `상품 목록`                                      |
| og:description | `전체 카테고리의 최신순 상품 30개를 확인하세요.` |
| og:image       | `http://localhost:3001/images/products/p26.jpg`  |
| h1 count       | `1`                                              |
| 주요 이동 링크 | `Commerce`, `상품` href 링크                     |
| 상품 결과 영역 | `aria-label="상품 검색 결과"` 포함               |

Products document에는 명확한 `h1`, 주요 navigation, 상품 결과 영역의 구조가 포함됐다.

## 정상 Empty

재현 URL:

```txt
http://localhost:3001/products?q=존재하지않는상품&category=goods
```

저장 파일:

- [products-empty-document.html](./products-empty-document.html)
- [products-empty-headers.txt](./products-empty-headers.txt)

관찰 결과:

| 항목           | 값                                                            |
| -------------- | ------------------------------------------------------------- |
| title          | `존재하지않는상품 상품 \| Commerce`                           |
| description    | `뷰티·잡화 카테고리의 최신순 상품 검색 결과가 0개입니다.`     |
| og:title       | `존재하지않는상품 상품`                                       |
| og:description | `뷰티·잡화 카테고리의 최신순 상품 검색 결과가 0개입니다.`     |
| og:image       | `http://localhost:3001/images/week-07/hero-1600.webp`         |
| h1 count       | `1`                                                           |
| 화면 구조      | `총 0개`, `조건에 맞는 상품이 없습니다.` document 응답에 포함 |

정상 empty는 실패 fallback이 아니라 성공 응답의 0건 metadata를 제공했다. 첫 상품이 없으므로 Open Graph image는 공통 fallback image를 유지했다.

## Metadata Query Failure

재현 조건:

```bash
APP_ORIGIN=http://127.0.0.1:9 pnpm build
APP_ORIGIN=http://127.0.0.1:9 PORT=3003 pnpm start
```

저장 파일:

- [products-query-failure-document.html](./products-query-failure-document.html)
- [products-query-failure-headers.txt](./products-query-failure-headers.txt)
- [query-failure-reproduction.txt](./query-failure-reproduction.txt)

관찰 결과:

| 항목           | 값                                                  |
| -------------- | --------------------------------------------------- |
| build          | 성공                                                |
| document       | `200`                                               |
| title          | `Commerce`                                          |
| description    | `Loopers 커머스에서 취향에 맞는 상품을 발견하세요.` |
| og:title       | `Commerce`                                          |
| og:description | `Loopers 커머스에서 취향에 맞는 상품을 발견하세요.` |
| og:image       | `http://127.0.0.1:9/images/week-07/hero-1600.webp`  |

metadata 조회 실패 시 페이지별 빈 metadata를 반환하지 않고 root 공통 metadata가 유지됐다. 정상 empty와 달리 검색어/카테고리 기반 title과 description을 만들지 않았다.

## 서버 호출 계수

임시 계측:

```ts
console.info(
  `[product-route-call] ${request.nextUrl.pathname}${request.nextUrl.search} ua=${request.headers.get("user-agent") ?? ""}`,
);
```

실행 조건:

```bash
APP_ORIGIN=http://localhost:3002 NEXT_PUBLIC_PRODUCT_API_SCENARIO=slow PRODUCT_API_CALL_LOG=1 pnpm build
APP_ORIGIN=http://localhost:3002 NEXT_PUBLIC_PRODUCT_API_SCENARIO=slow PRODUCT_API_CALL_LOG=1 PORT=3002 pnpm start
curl http://localhost:3002/products
```

로그:

```txt
[product-route-call] /api/products?category=all&sort=latest&page=1&pageSize=12&scenario=slow ua=node
[product-route-call] /api/products?category=all&sort=latest&page=1&pageSize=12&scenario=slow ua=node
```

판단:

- 동일 slow document 요청 1회에서 Products Route Handler는 2회 호출됐다.
- Browser Network가 아니라 서버 로그로 호출 횟수를 확인했다.
- metadata와 본문은 같은 URL 정규화와 같은 `productQueries.list()`를 사용했지만, metadata 경로와 본문 prefetch가 각각 새 QueryClient를 사용하므로 Route Handler 호출은 2회였다.
- 계측 코드는 관찰 후 제거했고, `git diff -- src/app/api/products/route.ts` 기준 최종 코드에 남지 않았다.

## User-Agent 응답 시간 비교

실행 조건:

```bash
APP_ORIGIN=http://localhost:3002 NEXT_PUBLIC_PRODUCT_API_SCENARIO=slow
```

저장 파일:

- [curl-timing.txt](./curl-timing.txt)

결과:

| User-Agent          | time_starttransfer | time_total |
| ------------------- | -----------------: | ---------: |
| normal              |             1.599s |     1.600s |
| facebookexternalhit |             1.526s |     1.527s |

두 요청 모두 slow metadata/body 데이터 조회를 기다린 뒤 document 응답을 시작했다. 이 측정에서는 facebookexternalhit만 metadata 응답 시점이 추가로 늦어지는 차이는 관찰되지 않았다.

## 검증

코드 변경 커밋 전 검증:

```bash
pnpm vitest run src/shared/api/apiUtils.test.ts src/_pages/home/model/homeMetadata.test.ts src/_pages/products/model/productListMetadata.test.ts src/_pages/home/api/homeApi.test.ts src/_pages/products/api/productApi.test.ts src/_pages/products/queries/productQueries.test.ts src/shared/config/architecture/fsdImportBoundaries.test.ts
pnpm typecheck
pnpm lint
APP_ORIGIN=http://localhost:3001 pnpm build
```

측정 후 확인:

```bash
git diff -- src/app/api/products/route.ts
```

결과:

- Vitest: 7개 파일, 14개 테스트 통과
- TypeScript: 통과
- ESLint: 통과
- production build: 통과
- 임시 서버 호출 계수 코드: 제거 완료

## 판단

- 동적 metadata는 공유 정보 품질을 높였지만, slow 조건에서는 document 응답 시작이 약 1.5초까지 늦어졌다.
- Products metadata와 본문 prefetch가 같은 query factory를 사용해 URL 조건과 결과는 일치한다.
- Open Graph shallow merge로 공통 필드가 사라지지 않도록 페이지 metadata에서 공통 `siteName`, `locale`, `type`을 명시적으로 유지했다.
- 정상 empty는 URL 조건과 0건을 설명하는 metadata를 제공하고 fallback image를 유지했다.
- metadata query failure는 정상 empty와 다른 fallback이다. 페이지별 metadata를 만들지 않고 root 공통 metadata를 상속했다.
