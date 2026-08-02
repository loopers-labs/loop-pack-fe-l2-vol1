# 도메인(Feature) 정보

각 도메인 슬라이스가 무엇을 소유하는지 기록한다. `architecture-review` skill(배치 제안 모드)이 레이어/도메인 배치를 판단할 때 이 문서를 참조한다.

새 도메인이 생기면 아래 템플릿을 복사해 항목을 추가한다.

---

## 템플릿

### {도메인명}

- **레이어**: entities | features
- **소유 범위**: 이 도메인이 책임지는 데이터 / 화면 / 유스케이스
- **의존 관계**: 이 도메인이 참조하는 다른 도메인 (entities는 shared만 참조, features는 entities까지 참조 가능)
- **위치**: `src/{layer}/{도메인명}`

---

## 예시

### product (entities)

- **레이어**: entities
- **소유 범위**: 상품 모델(id, name, price, thumbnail 등), 상품 카드 UI, 상품 단건 조회
- **의존 관계**: 없음 (entities는 shared만 참조)
- **위치**: `src/entities/product`

### cart (features)

- **레이어**: features
- **소유 범위**: 장바구니 담기 / 삭제 / 수량 변경 유스케이스, 장바구니 상태
- **의존 관계**: `entities/product` (상품 정보 참조)
- **위치**: `src/features/cart`

### product-filter (features)

- **레이어**: features
- **소유 범위**: 상품 목록 필터링/정렬 유스케이스 (카테고리, 가격순 등)
- **의존 관계**: `entities/product`
- **위치**: `src/features/product-filter`

---

## 프로젝트 실제 도메인

### product (entities)

- **레이어**: entities
- **소유 범위**: 상품 모델(`Product`), 정렬 기준(`ProductSort`), 목록 조회 계약(`ProductListQuery`/`ProductListResponse`), 목록 조회(`useProductList`)
- **의존 관계**: `entities/category` (상품의 카테고리 필드 참조)
- **위치**: `src/entities/product`

### category (entities)

- **레이어**: entities
- **소유 범위**: 카테고리 모델(`Category`, `CategoryId`, `CATEGORY_IDS`)
- **의존 관계**: 없음 (entities는 shared만 참조)
- **위치**: `src/entities/category`

### wishlist (features)

- **레이어**: features
- **소유 범위**: 위시리스트 담기/빼기 유스케이스와 상태(`useWishlistStore`)
- **의존 관계**: 없음 (상품 id만 다루고 `entities/product`를 직접 참조하지 않음)
- **위치**: `src/features/wishlist`

### cart (features)

- **레이어**: features
- **소유 범위**: 장바구니 담기/빼기 유스케이스와 상태(`useCartStore`)
- **의존 관계**: 없음 (상품 id만 다루고 `entities/product`를 직접 참조하지 않음)
- **위치**: `src/features/cart`

### product-filter (features) — 실제 배치

- **레이어**: features
- **소유 범위**: 검색어/카테고리/정렬/페이지 URL 상태(`useProductListParams`), 필터 UI(`ProductFilters`)
- **의존 관계**: `entities/category`(`CategoryId`), `entities/product`(`ProductSort`)
- **위치**: `src/features/product-filter`
