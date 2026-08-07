# 3단계 — 동적 metadata와 Open Graph

> 측정일: 2026-08-07  
> 구현 SHA: `2b2f1b3e` · 스트리밍 경계 수정 및 최종 측정 SHA: `16de222a`

## 실행 조건

- normal·empty·UA 측정: build/runtime 모두 `APP_ORIGIN=http://127.0.0.1:3103`
- query failure: build/runtime 모두 `APP_ORIGIN=http://127.0.0.1:9`
- production build와 `next start` 사용
- 로컬 Open Graph URL은 document 조립 확인용이며 배포 증거로 사용하지 않는다.

## URL·query 계약

서버와 브라우저는 같은 정규화 규칙과 `productListQueryOptions()`를 사용한다. `q`, `category`, `sort`, `page`, `pageSize`, `scenario`가 query key와 실제 GET에 함께 들어간다. 브라우저 fetch는 TanStack Query의 `AbortSignal`을 전달하고, metadata와 본문 server fetch는 signal을 생략해 동일한 URL·options를 만든다.

서버 `getServerQueryClient()`는 호출할 때마다 새 인스턴스를 만든다. metadata와 본문이 QueryClient 캐시를 공유하지 않으며, 실제 HTTP 통합 여부는 아래 Route Handler 계수로 따로 확인했다.

## document 증거

| 상황 | title | description | OG image |
| --- | --- | --- | --- |
| normal `/products?category=fashion` | `패션 상품 \| Loopers` | `카테고리 패션 · 정렬 최신순 · 상품 6개` | 첫 상품 `p6.jpg` |
| empty `/products?category=digital&scenario=empty` | `디지털 상품 \| Loopers` | `카테고리 디지털 · 정렬 최신순 · 상품 0개` | 공통 fallback `p1.jpg` |
| query failure | `Loopers 커머스` | root 공통 description | root fallback `p1.jpg` |

세 document 모두 status 200, `h1 상품 목록`, 페이지 설명, Header의 `href` 링크, `siteName=Loopers`, `locale=ko_KR`, `type=website`를 확인했다. `robots: noindex`는 없었다. query failure에서는 페이지별 `패션 상품` metadata가 남지 않았다.

원본: `evidence/stage3-documents.json`

## 서버 호출 계수

Route Handler에 임시 marker를 넣고 document를 각각 한 번 요청했다.

| document | 조회 시도 소비자 | 실제 Route Handler 호출 |
| --- | --- | --- |
| `/` | HeroCopy·HomeSections·generateMetadata | `/api/home?scenario=slow` 1회 |
| `/products?scenario=slow` | 본문 prefetch·generateMetadata | 동일 조건 `/api/products` 1회 |

QueryClient가 여러 개여도 같은 request 범위의 native fetch URL·options가 같아 실제 HTTP가 한 번으로 합쳐졌다. 계측 marker는 관찰 직후 제거했고 `rg WEEK07_COUNT src` 결과가 0건임을 확인했다.

원본: `evidence/stage3-route-count.json`

## UA 응답 시점

각 UA를 한 번 warm-up한 뒤 `curl`로 3회 측정했다.

| URL · UA | time_starttransfer 범위 | time_total 범위 |
| --- | --- | --- |
| Products slow · normal | 0.009597~0.010999s | 1.518097~1.526553s |
| Products slow · facebookexternalhit | 1.513844~1.520002s | 1.514539~1.520644s |
| Home · normal | 0.009267~0.010224s | 1.514287~1.517178s |
| Home · facebookexternalhit | 1.513918~1.521866s | 1.514716~1.522753s |

일반 UA는 약 10ms에 셸을 먼저 받지만 전체 document 완료에는 slow metadata/본문 데이터의 약 1.5초가 든다. `facebookexternalhit`은 metadata가 준비될 때까지 첫 바이트도 약 1.5초 지연된다.

원본: `evidence/stage3-ua-timings.json`

## 측정 중 발견하고 수정한 회귀

최초 구현 SHA `2b2f1b3e`에서는 Products route 함수가 server prefetch를 직접 `await`해 일반 UA의 첫 바이트도 약 1.55초 막혔다. 목록의 정적 셸을 먼저 반환하고 prefetch+hydration만 기존 Suspense 안으로 옮겼다. 최종 SHA `16de222a`에서 Products 일반 UA의 첫 바이트는 약 10ms로 회복됐고, 2단계의 Client Query 상태 소유권과 AbortSignal은 유지했다.

## query failure

`APP_ORIGIN=http://127.0.0.1:9`로 build와 runtime을 맞췄다. build는 성공했고 document는 status 200이었다. 페이지 query가 실패하면 `generateMetadata()`가 `{}`를 반환해 root title·description·공통 Open Graph를 상속했다. 정상 empty는 0건을 설명하는 페이지 metadata를 유지하므로 두 fallback이 구분된다.
