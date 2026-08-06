# Select 설계 결정

## 왜 Headless Hook 패턴인가

로직(열기/닫기·선택값·키보드·품절 스킵)은 한 벌이지만 UI는 사용처마다 다르다.
`useSelect` 훅이 상태와 핸들러만 노출하고, 어떻게 그릴지는 사용처가 결정한다.

같은 로직으로 3가지 UI를 렌더한다:
- **TextSelect** — 라벨·가격·무료배송 텍스트 목록
- **SizeSelect** — 사이즈 숫자 + 배송 안내
- **ThumbnailSelect** — 상품 이미지 + 가격·할인율

## value를 문자열이 아닌 객체 전체로 쓰는 이유

선택 후 가격·배송비 계산에 바로 쓸 수 있어야 한다.
`selectedOption.price`, `selectedOption.freeShipping` 같은 필드를 문자열 파싱 없이 접근한다.

## 키보드 이동에서 품절 건너뛰기

ArrowDown/ArrowUp에서 `while`로 `isDisabled`인 옵션을 건너뛴다.
`isDisabled`는 사용처가 주입(의존성 역전)해서 훅이 도메인 규칙에 의존하지 않는다.

## 레퍼런스

Radix UI `useSelect` · Headless UI `Listbox` — API 모양(인터페이스 설계)만 참고.
