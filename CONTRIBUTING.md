# CONTRIBUTING.md

> 프로젝트 구조·컨벤션과 그 "왜"를 사람이 파악하기 위한 문서.
> AI 코드 생성 규칙(요약)은 `CLAUDE.md` 참고.

- **규칙/컨벤션**: 잘 바뀌지 않는 약속.
- **구조 개요**: 현재 시점 스냅샷. 코드가 바뀌면 함께 갱신한다.

---

## 📁 폴더 구조 규칙

- **폴더는 kebab-case, 파일은 PascalCase**(컴포넌트명). 예) `price-summary/PriceSummaryCard.tsx`.
  폴더를 소문자로 통일하면 OS 간 대소문자 충돌(Linux CI에서만 터지는 버그)을 막는다. 파일은 컴포넌트명과 1:1로 맞춰 한 쌍임을 드러낸다. CSS 모듈도 `PriceSummaryCard.module.css`로 맞춘다.
- **폴더는 "묶을 게 있을 때만".** 파일 2개 이상(컴포넌트+CSS, 또는 관련 컴포넌트 묶음)일 때만 폴더로. 하나뿐이면 `components/` 바로 아래 평평하게 두고, 파일이 늘면 그때 폴더화한다.
- **기능별로 묶는다.** 관련 컴포넌트는 기능 폴더로(`order/`, `delivery/`). 단일 카드+전용 스타일도 기능 폴더로(`terms/`, `price-summary/`).
- **단독 컴포넌트와 충돌하면 폴더명을 줄이지 않는다.** 공용 `Price.tsx`가 있으므로 결제 금액 카드 폴더는 `price`가 아니라 `price-summary`.

## 🎨 CSS 전략

전역 CSS와 CSS Modules를 **스타일의 주인이 누구인가**로 나눈다.

- **공용 base → 전역(`common.css`).** 특정 컴포넌트 소속이 아니라 앱 전반이 공유하는 것(페이지 레이아웃, `input`/`button`/`label`, 공용 행 레이아웃, 디자인 토큰). 여러 곳이 공유하므로 스코프 격리하면 안 된다 — 모듈로 만들면 중복되거나 갈 곳이 없다.
- **컴포넌트 고유 → CSS Modules(`*.module.css`).** 주인이 명확한 스타일(`.total`은 결제 금액 카드, `.tag`는 상태 태그). 클래스명이 자동 스코프되어 충돌이 없다.
- **모듈 클래스명은 camelCase.** 하이픈은 JS에서 `styles.addr-summary`로 못 읽으므로 `addrSummary`.

## ✍️ 네이밍이 이런 이유

- **`on~`(콜백 prop) / `handle~`(핸들러).** 방향을 드러내기 위함. `on~`은 자식→부모로 올라가는 이벤트 선언, `handle~`은 그 처리 구현.
- **props 타입을 `컴포넌트명+Props`로 분리.** 시그니처가 짧아지고 검색·재사용이 쉽다.
- **의미 기반 네이밍.** 구현이 바뀌어도 이름이 어긋나지 않게(`section`이 아니라 `card`).

## 🧩 컴포넌트 패턴

- **Card compound.** 카드 UI는 `Card` + `Card.Header`/`Card.Title`/`Card.Body`로 구성한다. 머리말 구성(제목만 / 제목+버튼 / 제목 없음)이 카드마다 달라 호출자가 자유 조합해야 하기 때문. `Card.Title`은 내부에서 `useId`로 `aria-labelledby`를 자동 연결해 `<section>`을 접근성 랜드마크로 노출한다.
- **상태 소유권.** "이 값을 누가 읽는가"로 위치를 정한다. 입력 중 임시값은 자식이, 여러 곳이 읽는 결과값은 공통 부모가 소유. (상세 규칙은 `CLAUDE.md`)

---

## 🗺️ 현재 구조 개요

> ⚠️ **현재 시점 스냅샷.** 구조가 바뀌면 이 섹션도 함께 갱신한다.

```
market/
  CheckoutPage.tsx          # 상태·금액 계산·카드 조합
  OrderCompletePage.tsx     # 주문 완료 화면
  common.css                # 공용 base 스타일(전역)
  data.ts                   # 데이터 상수만 (유틸 함수 X)
  types.ts                  # 공용 타입

  components/
    card/                   # compound 베이스
    order/                  # OrderItemsCard, RecentOrdersCard, OrderLineRow, OrderStatusTag(+module)
    delivery/               # DeliveryCard(+module, AddressForm/Field 포함), DeliveryMemoCard, DeliveryMemo
    terms/                  # TermsCard(+module)
    price-summary/          # PriceSummaryCard(+module)
    CouponCard.tsx          # 단일 컴포넌트 (평평하게)
    PointsCard.tsx
    PaymentMethodCard.tsx
    Price.tsx               # 공용 금액 표시
```

- **`CheckoutPage`**: 공유 상태와 금액 계산을 소유, 카드들을 조합. 각 섹션의 UI·내부 상태는 카드가 담당.
- **`Price`**: 금액 표시 전용. 등급 할인 등 계산은 호출부(페이지)가 책임.
- **`data.ts`**: 데이터 상수만(유틸 함수는 두지 않음).
