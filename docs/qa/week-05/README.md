# 5주차 브라우저 QA 결과

대상: `feat/week-05` 브랜치, `http://localhost:3000` (기 실행 중인 dev 서버). 도구: `agent-browser`.

실행 순서는 지시대로 QA-1 → QA-2 → QA-3(C21) → QA-4(C22) → QA-5(D14) → QA-6(E10) → QA-7 순으로 진행했다. C21을 D14·E10보다 먼저 확립해, "새로고침은 전역 상태를 0으로 되돌린다"는 사실을 먼저 검증한 뒤에 "soft navigation은 되돌리지 않는다"는 대조를 관찰했다.

## 요약

| QA  | AC                           | 판정 |
| --- | ---------------------------- | ---- |
| 1   | C19 링크 공유 복원           | 통과 |
| 2   | C20 히스토리 스택 7상태      | 통과 |
| 3   | C21 새로고침이 상태 초기화   | 통과 |
| 4   | C22 뒤로가기 검색창 재동기화 | 통과 |
| 5   | D14 soft navigation 생존     | 통과 |
| 6   | E10 카테고리 칩 내비게이션   | 통과 |
| 7   | G4 /week-04 회귀 없음        | 통과 |

---

## QA-1 — C19: 링크 공유 복원 (새 세션)

**조작**: 새 브라우저 세션에서 `http://localhost:3000/products?q=%EC%8A%A4%ED%83%A0%EB%A6%AC&sort=price-asc` 를 직접 연다.

**기대**: URL 두 조건 유지, 상품 4개, 검색창에 '스탠리' 채워짐.

**실측**:

- URL: `http://localhost:3000/products?q=%EC%8A%A4%ED%83%A0%EB%A6%AC&sort=price-asc` (유지됨)
- 렌더된 상품 4개: `[STANLEY] GO CERAMIVAC 진공 텀블러/보틀 473ml`, `[STANLEY] 스탠리 클래식 진공 캠프머그 473미리`, `[STANLEY] 스탠리 클래식 포어 오버 커피 드리퍼 세트`, `스탠리 클래식 런치박스`
- 검색창(`textbox "검색"`) 값: `스탠리`

**판정**: 통과. 스크린샷: `c19-shared-link-restore.png`

---

## QA-2 — C20: 히스토리 스택 7상태 + 앞으로 3회

**조작**: `/products`(쿼리 없음)에서 시작 → 2페이지 버튼 클릭 → 정렬을 `popular`(인기순)로 변경 → 카테고리를 `digital`(디지털)로 변경 → 뒤로 3회 → 앞으로 3회.

실제 선택값: `X = sort=popular`, `Y = category=digital`.

**단계별 실측 URL**:

| 단계 | 조작              | 기대 URL                         | 실측 URL                                                       | 판정 |
| ---- | ----------------- | -------------------------------- | -------------------------------------------------------------- | ---- |
| 1    | 시작              | 쿼리 없음                        | `http://localhost:3000/products`                               | 일치 |
| 2    | 2페이지 버튼 클릭 | `?page=2`                        | `http://localhost:3000/products?page=2`                        | 일치 |
| 3    | 정렬 변경         | `?sort=popular` (page 키 없음)   | `http://localhost:3000/products?sort=popular`                  | 일치 |
| 4    | 카테고리 변경     | `?sort=popular&category=digital` | `http://localhost:3000/products?sort=popular&category=digital` | 일치 |
| 5    | 뒤로 1회          | `?sort=popular`                  | `http://localhost:3000/products?sort=popular`                  | 일치 |
| 6    | 뒤로 2회          | `?page=2`                        | `http://localhost:3000/products?page=2`                        | 일치 |
| 7    | 뒤로 3회          | 쿼리 없음                        | `http://localhost:3000/products`                               | 일치 |

**앞으로 3회 실측**:

| 앞으로 회차 | 기대 URL                         | 실측 URL                                                       | 판정 |
| ----------- | -------------------------------- | -------------------------------------------------------------- | ---- |
| 1회         | `?page=2`                        | `http://localhost:3000/products?page=2`                        | 일치 |
| 2회         | `?sort=popular`                  | `http://localhost:3000/products?sort=popular`                  | 일치 |
| 3회         | `?sort=popular&category=digital` | `http://localhost:3000/products?sort=popular&category=digital` | 일치 |

**판정**: 통과 (7상태 + 앞으로 3회 모두 개별 일치). 스크린샷: `c20-history-final-state.png` (앞으로 3회 완료 후 최종 상태)

---

## QA-3 — C21: 새로고침이 전역 상태를 날린다

**조작**:

1. `/products?q=스탠리`에서 서로 다른 상품 2개(`[STANLEY] 스탠리 클래식 포어 오버 커피 드리퍼 세트`, `스탠리 클래식 런치박스`)를 장바구니에 담고, 1개(`[STANLEY] 스탠리 클래식 진공 캠프머그 473미리`)를 위시리스트에 담음
2. 헤더 확인
3. URL에 조건(`?q=스탠리`)이 있는 상태에서 새로고침(`reload`)

**기대**: URL 조건은 복원, 두 개수는 각각 0.

**실측**:

- 새로고침 전 헤더: `위시리스트 1`, `장바구니 2`
- 새로고침 후 URL: `http://localhost:3000/products?q=%EC%8A%A4%ED%83%A0%EB%A6%AC` (유지됨)
- 새로고침 후 헤더: `위시리스트 0`, `장바구니 0`

**판정**: 통과. 스크린샷: `c21-before-reload.png`, `c21-after-reload.png`

---

## QA-4 — C22: 뒤로가기 시 검색창 재동기화

**조작**:

1. `/products`에서 `'스탠리'`로 검색 → `?q=스탠리`
2. `'니트'`로 재검색 → `?q=니트`
3. 뒤로 가기

**기대**: URL이 `?q=스탠리`로 돌아가고, 검색창 값도 `'스탠리'`로 따라간다.

**실측**:

- 뒤로가기 후 URL: `http://localhost:3000/products?q=%EC%8A%A4%ED%83%A0%EB%A6%AC`
- 뒤로가기 후 검색창(`textbox "검색"`) 값: `스탠리`

**판정**: 통과. 스크린샷: `c22-searchbox-back-resync.png`

**관찰 사항 (버그로 단정하지 않음)**: 검색창에 값을 입력(`fill` 또는 실제 키보드 `type` 모두)한 뒤 아무 것도 누르지 않고 최대 4.5초까지 기다려도 URL에 `q=` 파라미터가 반영되지 않았다. `Enter`를 누른 직후에만 URL이 갱신됐다. 즉 검색은 "타이핑 중 디바운스 자동 반영"이 아니라 "Enter 제출" 방식으로 동작하는 것으로 보인다. 이것이 의도된 설계(제출형 검색)인지, 디바운스 자동반영이 요구사항이었는지는 스펙 문서로 확인이 필요하다 — 코드 수정 없이 사실만 보고한다.

---

## QA-5 — D14: soft navigation에서 전역 상태 생존

**조작**:

1. `/`에서 서로 다른 상품 2개(`메이커스 투명케이스`, `하이드레이팅 나이트 립 마스크...`)를 장바구니에, 1개(`Cosymosy Mini Bird Keyring - Light Gray`)를 위시리스트에 담음
2. 헤더 확인
3. 헤더의 '상품' 링크(`click`, URL 직접 이동이나 `goto()` 우회 없이)를 클릭

**기대**: `/products`에서 두 개수가 그대로 2·1, `performance.getEntriesByType('navigation')[0].name`이 여전히 `/`로 끝남(문서 미교체 증거).

**실측**:

- 클릭 전 헤더: `위시리스트 1`, `장바구니 2`
- 클릭 후 URL: `http://localhost:3000/products`
- 클릭 후 헤더: `위시리스트 1`, `장바구니 2` (유지됨)
- `performance.getEntriesByType('navigation')[0].name` = `"http://localhost:3000/"` (여전히 `/`로 끝남 → 문서 교체 안 됨, soft navigation 확인)

**판정**: 통과. 스크린샷: `d14-soft-nav-counts-survive.png`

---

## QA-6 — E10: 카테고리 칩 내비게이션

**조작**:

1. 홈에서 서로 다른 상품 2개(`메이커스 투명케이스`, `하이드레이팅 나이트 립 마스크...`)를 장바구니에, 1개(`Cosymosy Mini Bird Keyring - Light Gray`)를 위시리스트에 담음
2. 헤더 확인 (`위시리스트 1`, `장바구니 2`)
3. '홈' 카테고리 칩 클릭

**기대**: `/products?category=home`에 도달, 6개 표시, 두 개수 2·1 유지.

**실측**:

- 클릭 후 URL: `http://localhost:3000/products?category=home`
- 상품 카드(`h3`) 개수: 6개
- 클릭 후 헤더: `위시리스트 1`, `장바구니 2` (유지됨)

**판정**: 통과. 스크린샷: `e10-category-chip-home.png`

---

## QA-7 — G4(브라우저분): /week-04 회귀 없음

**조작**: `http://localhost:3000/week-04`를 연다.

**기대**: 5주차 커머스 Header 없이 기존대로 동작.

**실측**:

- URL: `http://localhost:3000/week-04` (정상 로드)
- `header` 셀렉터로 텍스트 조회 시 "Element not found" — 커머스 `Header`(장바구니/위시리스트/카테고리 내비게이션 포함) 없음
- 페이지는 자체 `<h1>Commerce</h1>` 제목과 4주차 상품 옵션 UI(러닝화 사이즈 선택, 베이글 세트 옵션 선택, 원두 번들 구성 선택, 구매하기 버튼)를 그대로 렌더

**판정**: 통과. 스크린샷: `g4-week04-no-commerce-header.png`

---

## 발견한 버그

**이 QA의 판정 범위는 동작(기능) 흐름이다** — URL 상태 복원, 히스토리 스택, 새로고침에 의한 전역 상태 초기화, soft navigation에서의 전역 상태 생존 등 QA-1~7이 조작·관측한 대상. 이 범위에서는 기능적 결함을 발견하지 못했다. QA-4에서 기록한 "검색은 Enter 제출형으로 동작하며 타이핑만으로는 디바운스 자동반영되지 않는다"는 점만 관찰 사항으로 남긴다 (위 QA-4 절 참고, 코드 미수정).

**렌더링/시각 결과는 이 QA의 판정 대상이 아니었다.** 아래 스크린샷은 QA 시점 상태를 그대로 담고 있어 다음 두 렌더 결함이 실제로 찍혀 있다 — 둘 다 이후 코드리뷰에서 지적되어 커밋 `9acd406`("fix: 커머스 목록 화면 동작 결함 6건 수정")에서 수정됐다:

- **헤더 무스타일**: `--commerce-*` CSS 커스텀 프로퍼티가 `.page`에만 선언돼 있어, `.page`의 자손이 아닌 `<Header/>`가 이를 상속받지 못했다. 폴백 없는 `var()` 참조는 값을 찾지 못하면 선언 전체가 computed-value 시점에 invalid 처리되어 속성이 아예 적용되지 않는다(CSS 커스텀 프로퍼티는 상속으로만 전파된다) — 그 결과 헤더 경계선·hover 색·포커스 링이 전부 무효로 렌더됐다. `9acd406`은 `.shell` 래퍼를 도입해 커머스 서브트리 전체가 변수를 상속받게 했다.
- **판매가/정가 미구분**: 상품 카드에서 할인가와 정가가 시각적 구분 없이 "75,000원89,000원"처럼 붙어 렌더됐다. `9acd406`은 시각 구분 스타일을 추가하고, 취소선은 스크린리더가 읽지 않으므로 `<s>`와 시각적으로 숨긴 판매가/정가 레이블을 함께 넣었다.

## 산출물

- `docs/qa/week-05/README.md` (본 문서)
- `docs/qa/week-05/c19-shared-link-restore.png`
- `docs/qa/week-05/c20-history-final-state.png`
- `docs/qa/week-05/c21-before-reload.png`
- `docs/qa/week-05/c21-after-reload.png`
- `docs/qa/week-05/c22-searchbox-back-resync.png`
- `docs/qa/week-05/d14-soft-nav-counts-survive.png`
- `docs/qa/week-05/e10-category-chip-home.png`
- `docs/qa/week-05/g4-week04-no-commerce-header.png`
