# ProductList 리팩터링 기록

## 관심사 분류

| 위치 | 관심사 | 판단 | 근거 |
| --- | --- | --- | --- |
| `ProductListPage.tsx` | 페이지 조합 | 유지 | 페이지는 URL 초기화, 훅 조합, 스크롤/URL 동기화, 주요 UI 컴포넌트 배치만 담당합니다. API 호출과 상세 UI 렌더링은 밖으로 뺐습니다. |
| `components/ProductFilterPanel.tsx` | 필터 UI | 분리 | 카테고리, 가격, 재고 토글의 JSX와 이벤트 바인딩을 페이지에서 분리했습니다. 필터 상태 규칙은 `useProductFilters`가 계속 소유합니다. |
| `components/ProductToolbar.tsx` | 검색/정렬/보기 모드 UI | 분리 | 검색 입력, 정렬 select, 보기 모드 select는 화면 조작 UI입니다. 상태 변경 규칙과 서버 조회는 모르게 했습니다. |
| `components/ProductGrid.tsx` | 상품 목록 UI | 분리 | 빈 목록 처리와 카드 반복 렌더링을 페이지에서 분리했습니다. 상품 조회 방식이나 필터 규칙은 알지 않습니다. |
| `components/ProductCard.tsx` | 상품 카드 UI | 분리 | 상품 하나의 배지, 가격, 위시리스트 버튼 렌더링을 모았습니다. 배지 판정과 포맷팅은 `utils/productRules.ts`의 순수 함수를 사용합니다. |
| `components/ProductPagination.tsx` | 페이지네이션 UI | 분리 | 페이지 번호 계산은 훅에 남기고, 버튼 렌더링과 클릭 전달만 담당하게 했습니다. |
| `hooks/useProducts.ts` | 서버 상태 | 분리 | 상품 조회는 loading, error, data, stale response 방지가 같이 움직입니다. 컴포넌트에 두면 UI를 읽다가 비동기 제어까지 따라가야 해서 훅으로 뺐습니다. |
| `hooks/useProductFilters.ts` | 클라이언트 필터 상태 | 분리 | 카테고리, 가격, 정렬, 검색, 재고 토글은 필터가 바뀔 때 페이지를 1로 되돌리는 같은 규칙을 공유합니다. |
| `hooks/useProductPagination.ts` | 페이지 상태와 페이지 번호 계산 | 분리 | 현재 페이지는 상품 조회에 필요하고, 페이지 번호는 totalCount가 온 뒤 계산됩니다. 둘을 한 훅에서 다루되 조회 결과와의 순환 의존은 `getPageInfo`로 끊었습니다. |
| `hooks/useWishlist.ts` | 위시리스트 localStorage 동기화 | 분리 | 화면은 위시 여부만 알면 됩니다. 저장소 읽기/쓰기는 브라우저 외부 시스템과의 동기화라 훅 안에 모았습니다. |
| `hooks/useRecentlyViewed.ts` | 최근 본 상품 localStorage 동기화 | 분리 | 최근 본 상품은 중복 제거와 최대 10개 제한이 함께 움직입니다. 클릭 핸들러 안에 두면 목록 UI가 저장 규칙을 알게 됩니다. |
| `services/productService.ts` | API 요청 계약 | 분리 | endpoint, query key 이름, 실패 메시지는 UI가 알 필요가 없습니다. fetch 구현을 한 곳으로 모았습니다. |
| `utils/productRules.ts` | 상품 배지/가격 규칙 | 분리 | 할인율, 품절 임박, BEST, 무료배송, NEW 판정은 React를 몰라도 되는 순수 계산입니다. |
| `utils/productListUrl.ts` | URL 상태 직렬화 | 분리 | URL에 쓰는 규칙과 URL에서 읽는 규칙이 달라지면 새로고침/공유 링크가 깨집니다. 같은 파일에서 양방향을 관리합니다. |
| `utils/textHighlight.ts` | 검색어 하이라이트 분리 | 분리 | 검색어는 사용자 입력이기 때문에 정규식 특수문자를 그대로 넣으면 터질 수 있습니다. 문자열 분리는 순수 함수로 테스트했습니다. |

## 일부러 하지 않은 것

| 대상 | 하지 않은 결정 | 이유 |
| --- | --- | --- |
| React Query 도입 | 직접 `useProducts`로 처리 | 지금은 단일 화면의 단일 목록 조회입니다. 캐싱, invalidate, 중복 요청 제거가 앱 전체 문제로 번지기 전이라 라이브러리보다 레이어 감각을 먼저 확인했습니다. |
| 전역 상태 도입 | Context/Zustand 미사용 | 필터와 페이지 상태는 이 페이지 안에서만 쓰입니다. props drilling 문제도 없어서 전역화하면 오히려 데이터 흐름이 흐려집니다. |
| 카드 내부의 작은 표시 요소 추가 분리 | `ProductCard` 내부에 유지 | `Badge`, `PriceArea`, `RatingArea`까지 쪼개면 이번 과제의 레이어 분리보다 파일 탐색 비용이 커집니다. 재사용 지점이 생기기 전까지는 카드 내부에 둡니다. |

## 숨은 버그 대응

| 증상 | 대응 | 검증 |
| --- | --- | --- |
| 새로고침/공유 링크에서 필터, 검색어, 페이지가 초기화됨 | `productListUrl.ts`에서 URL query를 읽고 쓰는 규칙을 분리했습니다. | `ProductListPage.test.tsx`, `productListUrl.test.ts` |
| API 에러 후 전체 페이지 새로고침 없이는 재시도할 수 없음 | `useProducts`가 `refetch`를 반환하고, 에러 화면의 다시 시도 버튼이 같은 조건으로 재요청합니다. | `ProductListPage.test.tsx` |
| 재고 필터가 클라이언트에서만 적용되어 totalCount와 요청 계약이 어긋남 | `productService`가 `inStock=true`를 API query에 포함하고, `useProducts`는 서버 응답을 그대로 사용합니다. | `productService.test.ts`, `useProducts.test.ts` |
| 검색어에 `.` 같은 정규식 특수문자가 들어오면 하이라이트가 깨질 수 있음 | `textHighlight.ts`에서 사용자 입력을 문자열 기준으로 분리합니다. | `textHighlight.test.ts`, `ProductListPage.test.tsx` |

## 검증한 동작

- 상품 조회 요청 query contract를 테스트했습니다.
- 빠른 필터/페이지 변경에서 오래된 응답이 최신 목록을 덮지 않도록 테스트했습니다.
- URL query를 초기 상태로 읽고, 변경된 상태를 다시 URL로 쓰는 규칙을 테스트했습니다.
- 검색어에 정규식 특수문자가 들어와도 하이라이트 분리가 깨지지 않도록 테스트했습니다.
- 위시리스트와 최근 본 상품 localStorage 동기화를 테스트했습니다.

## AI 사용 표기

테스트 케이스 초안과 분리 후보 정리는 AI 도움을 받았고, 최종 경계와 수정 범위는 코드 흐름과 과제 의도 기준으로 직접 검토했습니다.
