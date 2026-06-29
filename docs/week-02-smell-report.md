# 2주차 — Bad Code Smell 판별표 (`src/market/`)

> 11전략으로 모든 파일을 훑고, 해당/해당 없음을 근거와 함께 기록한다.
> "해당 없음"도 1줄 근거 필수. 안 고치는 것도 판단이다.

## 판별 대상 파일

- [✅] `CheckoutPage.tsx`
- [✅] `OrderLineRow.tsx`
- [✅] `OrderStatusTag.tsx`
- [✅] `Price.tsx`
- [✅] `DeliveryMemo.tsx`
- [✅] `types.ts` (타입 정의 — 11 컴포넌트 전략 비대상)
- [✅] `data.ts` (목 데이터 — 비대상)
- [✅] `market.css` (스타일 — 비대상)

---

## 판별표

> 각 전략마다 아래 4줄을 채운다. 해당 없으면 `해당`에 ❌ + `왜`에 1줄 근거만.

### [경계] 1. 변화의 경계
> 한 파일이 *몇 가지 이유로* 바뀌나? 디자인·결제규칙·데이터모양이 한 곳을 건드리면 변화축이 얽힌 것. (SRP) → 같이 변하는 것끼리 모으고 다른 속도로 변하는 건 분리.
- **해당:** ✅
- **위치:** CheckoutPage.tsx (가격 계산), Price.tsx (VIP 할인)
- **왜:** 배송비·쿠폰·적립금·VIP 등 결제정책(여러 변화축)이 CheckoutPage 한 곳에 얽혀 있고, 공통 표시 컴포넌트 Price에 VIP 할인 비즈니스 로직이 섞임(표시≠결제 버그까지 유발)
- **고칠 방향:** 가격 계산을 calculateOrderPrice 순수 함수로 분리(변화축 격리), VIP 정책은 Price에서 빼 finalPrice 계산으로 이동

### [경계] 2. 구현 vs 조합
> 고수준 흐름(레이아웃·순서)과 저수준 디테일(`<div style>`·포맷·계산)이 한 함수에 같은 깊이로 섞였나? → 배치하는 층과 그리는 층을 분리.
- **해당:** ✅
- **위치:** CheckoutPage.tsx
- **왜:** 고수준 배치(섹션 조합)와 저수준 계산(배송비/쿠폰/적립금/VIP)이 한 컴포넌트 같은 깊이로 섞임
- **고칠 방향:** 계산(구현)을 calculateOrderPrice로 추출 → CheckoutPage는 배치(조합)에 집중

### [경계] 3. God Component
> 한 컴포넌트가 상태·계산·렌더·핸들러를 다 떠안았나? 하나 고치려 전체를 읽어야 하면 신호. → 책임 단위로 추출(단, 줄 수가 아니라 변화축 따라). 분해 전 ②·⑦부터 의심.
- **해당:** ✅ (부분 수정)
- **위치:** CheckoutPage.tsx (296줄, useState 9 + 계산 + 렌더 11섹션)
- **왜:** 상태·계산·렌더·핸들러를 한 컴포넌트가 다 떠안음
- **고칠 방향:** 계산 추출(②)로 완화. 섹션(CouponSection 등) 추가 분리는 변화축이 더 분명해질 때까지 보류 — "줄 수로 쪼개기"는 과잉(④) 경계

### [경계] 4. 성급한 추상화
> 한두 곳 쓰자고 만든 범용 컴포넌트/유틸, 옵션 prop 분기 주렁주렁. 중복 세 번째까지는 참는다(YAGNI). → "있으면 줄이는" 전략. **여기서 새 추상화 만들면 안 됨.** 보통 "해당 없음".
- **해당:** ❌
- **위치:** -
- **왜:** 1~2곳 쓰자고 미리 일반화한 범용 컴포넌트/유틸 없음. Price는 3곳 이상 쓰는 공통 컴포넌트라 premature 아님
- **고칠 방향:** 해당 없음. 단 ①에서 Price의 VIP 로직을 빼면 한 줄짜리가 되어 ④가 새로 생길 수 있음

### [계약] 5. props 적게 · 이름은 역할대로
> props 5개 넘나? 각 prop이 독립적으로 의미 있나, 숨은 짝 의존이 있나(`badge` 없으면 무의미한 `badgeColor`)? `data`/`info` 같은 뭉뚱그린 이름? → 객체로 묶거나 children 위임, 역할 드러나는 이름.
- **해당:** ✅
- **위치:** OrderLineRow.tsx
- **왜:** props 8개 중 thumbnail/option/quantity/couponCode가 type에 종속
- **고칠 방향:** discriminated union으로 차단

### [계약] 6. boolean 폭발 → enum
> 상호배타적인 상태를 boolean 여러 개로(`isNew`+`isSoldOut`+`isActive`) → 8조합 중 유효는 몇 개뿐. 부정형(`notDisabled`)·모호한 이름(`show`)도. → `status: 'new'|'soldout'|'active'` 한 개로, 긍정형·`is`+형용사.
- **해당:** ✅ (OrderLineRow은 ❌ — type이 이미 enum)
- **위치:** OrderStatusTag.tsx (isPaid/isPreparing/isShipped/isDelivered/isCancelled 5개 boolean)
- **왜:** 상호배타 상태 5개를 boolean으로 → 32조합 중 5개만 유효, 모순 조합 허용. if(else-if 아님) 나열이라 다중 true 시 마지막이 덮는 잠재버그. 데이터엔 이미 `OrderStatus` enum 존재(types.ts)인데 호출부가 enum→boolean으로 쪼개 전달
- **고칠 방향:** 기존 `OrderStatus` enum을 prop으로 직접 받고 `Record<OrderStatus, {label,color}>` 룩업 → 호출부 `status={o.status}` 한 줄

### [계약] 7. 파생 상태 + key
> 다른 값에서 계산 가능한 걸 `useState`로 들고 있나? prop을 `useEffect`로 state에 동기화하나(합계·필터결과)? → 렌더 중 계산으로, 진짜 리셋이면 `key` prop. **화면 조작에서 버그로 터지기 쉬움**(수량 바꿨는데 합계 안 변함).
- **해당:** ✅
- **위치:** CheckoutPage.tsx:140 finalPrice
- **왜:** 적립금 눌렀더니 결제금액만 바뀌고 최종금액은 그대로여서 발견. 첫 렌더 값 고정이 원인
finalPrice를 useState로 들고 있어 첫 렌더 값에 고정 → 쿠폰/적립금/배송비 변경이 최종금액·결제버튼에 반영 안됨.
- **고칠 방향:**  useState→렌더 계산으로 전환

### [계약] 8. 확장은 위임으로
> 변형 추가할 때 컴포넌트 내부를 고치나? `className`/`onClick` 같은 표준 속성을 일일이 prop으로 재정의하나? → `...rest` + `ComponentPropsWithoutRef<'button'>`로 위임, children/slot으로 확장점 열기.
- **해당:** ✅ (미수정)
- **위치:** OrderLineRow.tsx (내부 `type ===` 분기 + 40줄 주석)
- **왜:** 줄 타입 추가 시 내부 분기 증가(주석). 이번엔 union으로 ⑤만 해소, 확장성은 composition 필요
- **고칠 방향:** composition(slot)이 정답이나 변경 폭 큼 → 이번엔 union 유지, 트레이드오프로 보류

### [합성] 9. Context 전에 composition
> Context 꺼내기 전에 부모가 JSX를 children으로 넘기면 drilling이 사라지나? → 상태 쓰는 곳에서 만들어 children으로 주입(상태가 아니라 내용을 끌어올리기).
- **해당:** ❌
- **위치:** -
- **왜:** 도입한 Context는 AddressSelectionContext 하나뿐인데 ⑪에서 composition을 먼저 검토함(중간 컴포넌트가 각자 상태 보유 → children 합성 어려움). composition으로 풀 수 있는데 반사적으로 Context 쓴 사례 없음
- **고칠 방향:** 해당 없음 (유지)

### [합성] 10. children vs slot
> 자식이 한 덩어리면 충분한가, 여러 자리(header/body/footer)가 필요한가? `headerContent`/`footerContent` 같은 ReactNode prop 여러 개 = slot 신호. → 단일이면 `children`, 여러 자리면 `Card.Header`식 slot.
- **해당:** ❌
- **위치:** -
- **왜:** JSX를 prop으로 받는(slot) 컴포넌트가 없고, children 하나로 부족한 곳도 없음. slot이 쓸모 있을 후보는 OrderLineRow뿐인데 ⑧에서 이미 판단함
- **고칠 방향:** 해당 없음 (유지)

### [합성] 11. Drilling vs Context
> prop이 3단계 이상 내려가는데 중간 컴포넌트가 쓰지도 않고 전달만 하나? 여러 트리에서 같은 상태 공유? → 서브트리 Context. **단 반사적 도입 금지** — 2단계면 유지, 3단계+패스스루일 때만 근거 적고.
- **해당:** ✅
- **위치:** CheckoutPage.tsx: 167 (onSelectAddress가 AddressField까지 내려감)
- **왜:** onSelectAddress가 DeliverySection,AddressForm 에선 안 쓰이고 3단계 내려가 AddressField에서만 쓰이는데 거쳐 전달(drilling)
- **고칠 방향:** composition 먼저 검토 → DeliverySection·AddressForm이 각자
  자기 상태(접기/펼치기·필터)를 가져 children 합성으로 끌어올리기 어려움.
  따라서 배송지 서브트리 Context(AddressSelectionContext)로 onSelectAddress 공유


---

## 리팩토링 근거 로그 (PR용 — 고친 것마다 한 줄)

| 전략 | 커밋/변경 | 한 줄 근거 |
|------|-----------|------------|
| ① 변화의 경계 | `refactor(market)` c58099c·b105c6c | Price의 VIP 비즈니스 로직 제거 + 가격 계산을 calculateOrderPrice로 분리(변화축 격리) |
| ② 구현 vs 조합 | `refactor(market)` b105c6c | 인라인 계산(구현)을 calculateOrderPrice 순수 함수로 추출 → CheckoutPage는 조합에 집중 |
| ③ God Component | `refactor(market)` b105c6c | 계산 추출로 CheckoutPage 완화. 섹션 추가 분리는 과잉 경계로 보류 |
| ⑤ props 적게 | `refactor(market)` dd47484 | OrderLineRow props 8개가 type에 종속(thumbnail/option/quantity/couponCode) → discriminated union으로 잘못된 조합 컴파일 차단 |
| ⑥ boolean 폭발 | `refactor(market)` 3bda53a | OrderStatusTag 5개 boolean → 기존 OrderStatus enum으로. 모순 조합 차단 + if체인 잠재버그 제거 + enum→boolean 왕복 제거 |
| ⑦ 파생상태 | `refactor(market)` a8bbca0 | finalPrice를 useState로 들고 있어 첫 렌더 값에 고정 → 쿠폰/적립금/배송비 변경이 미반영. 렌더 계산으로 전환해 가려진 결제금액 버그 복구 |
| ⑪ Drilling→Context | `refactor(market)` e830b8f | onSelectAddress가 중간 2개 컴포넌트를 통과만 함 → 서브트리 Context로 공유. selectedAddressId·addresses는 중간이 실제 사용해 props 유지 |
| (기타) non-null `!` | `chore(market)` 621c6dd | find 결과를 `!`로 타입 침묵 → 기본값 fallback으로 명시화(게이트 통과, 동작 동일). 11전략엔 없으나 커밋 게이트가 강제 |
| (기타) `as` 단언 | `refactor(market)` 628472e | 결제수단 배열 `as PaymentMethod[]` → 타입 선언 const로. CLAUDE.md 금지 항목(타입 침묵) 제거, 동작 동일 |

---

## 셀프 리뷰 4단계

- [✅] 1.동작 — happy path 말고 로딩/에러/빈 상태 + 상태 전이(있다→없다, 성공→실패)까지 머릿속에서 돌려봤나
- [✅] 2.의존성 — import한 패키지가 실제 존재? 기존 유틸 두고 중복 생성 안 했나? hook 의존성 배열 완전한가?
- [✅] 3.타입·린트 침묵 — 새 any/as/@ts-ignore/eslint-disable이 없나 (있다면 전부 "기계가 경고하려던 자리")
- [✅] 4.표면적 — dangerouslySetInnerHTML, 입력 무검증 렌더링 같은 XSS 구멍 없나
---

해당 Report 초안은 AI로 생성한 뒤 직접 검토·수정 후 AI 로 최종 검토하였습니다.