---
name: architecture-review
description: FSD 구조를 두 가지 모드로 다룬다 — 기존 코드는 위반 여부만 판단(수정안 없음), 신규 파일은 배치 위치를 제안한다.
---

### 두 가지 모드

- **판단 모드** (기본) — 기존 폴더 구조/코드가 FSD 규칙을 지키는지 검토할 때. "이렇게 고치세요"는 말하지 않는다. 고칠지·어떻게 고칠지는 사용자가 정한다.
- **배치 제안 모드** — 신규 파일을 만들 때 "이 파일이 어디로 가야 하는가"를 물을 때. 레이어·도메인 판단 후 경로를 제안한다.

요청이 "점검해줘 / 위반 있어? / 구조 봐줘"류면 판단 모드, "이 파일 어디 둬? / 새로 만드는 useXxx 위치는?"류면 배치 제안 모드로 동작한다.

### 레이어 정의 (fsd.how 기준)

상위 → 하위 순. 상위 레이어는 하위 레이어를 참조할 수 있고, 역방향은 금지한다.

- **app** — 애플리케이션 초기화(라우팅, 전역 스타일, provider)
- **widgets** — 하나의 완결된 화면 기능을 제공하는 독립적인 UI 블록
- **features** — 사용자에게 노출되는 구체적인 행위(비즈니스 가치가 있는 동작) 단위
- **entities** — 프로젝트가 다루는 비즈니스 도메인의 핵심 모델
- **shared** — 모든 레이어에서 재사용되는, 도메인 지식이 없는 코드

같은 레이어의 다른 슬라이스(도메인)끼리는 직접 참조하지 않는다 — 필요하면 상위 레이어(`widgets`/`app`)에서 조합한다. 도메인별 소유 범위는 `DOMAINS.md`를 참조한다.

---

## 판단 모드

기존 폴더 구조/코드에 대해서만 쓴다. **판단만 한다** — 위반 여부와 근거만 보고하고, 수정 코드나 대안 구조는 제시하지 않는다.

### 점검 항목 (4가지 고정)

1. **import 방향 위반** — 하위 레이어가 상위 레이어를 import하는가 (`app > widgets > features > entities > shared`)
2. **같은 레이어 슬라이스 간 직접 의존** — 같은 레이어의 다른 슬라이스를 직접 import하는가 (예: `features/cart`가 `features/checkout`을 직접 import)
3. **entities의 상위 레이어 침범** — `entities`가 `features`/`widgets`/`app`의 상태·액션·컴포넌트를 가져다 쓰는가
4. **shared의 비즈니스 로직 포함** — `shared`에 도메인 이름이 드러나는 로직·상수·타입이 있는가 (예: `shared/lib/calculateCartDiscount.ts`)

이 4개 외의 이슈(네이밍, 성능, 테스트 커버리지 등)는 범위 밖 — 언급하지 않는다.

### 분석 순서

1. 대상 폴더 트리를 레이어와 슬라이스로 매핑한다
2. 각 파일의 import 문을 읽고 위 4가지 항목에 하나씩 대조한다
3. 위반이 없으면 "위반 없음"이라고만 답하고 억지로 지적거리를 만들지 않는다
4. `import type`처럼 타입만 가져오는 경우는 런타임 의존을 만들지 않으므로 2번 항목의 예외로 간주하되, 예외 처리했다는 사실은 결과에 남긴다

### 판단 결과 형식

```text
파일 | 위반 항목 | 판단 근거
entities/product/ui/ProductCard.tsx | entities의 상위 레이어 침범 | features/wishlist의 useWishlistStore를 직접 호출함 — entity가 feature 상태에 의존하는 역방향 참조
```

위반이 있는 항목만 나열한다.

### 판단 모드에서 하지 않는 것

- ❌ 수정 코드 제시
- ❌ 대안 구조 설계 (그건 RFC 단계의 몫)
- ❌ 위반이 아닌데 스타일이 마음에 안 든다고 지적
- ❌ 4가지 점검 항목 밖의 지적 (네이밍, 중복 등)

---

## 배치 제안 모드

신규 파일 하나를 어디에 만들지 물을 때만 쓴다.

### 분석 순서

1. 파일이 어느 레이어에 속하는지 판단한다
2. 같은 레이어 안에서 어느 도메인(슬라이스)에 속하는지 판단한다 — `DOMAINS.md` 참조, 없는 도메인이면 템플릿으로 추가 제안
3. import 방향이 규칙을 위반하지 않는 위치인지 확인한다
4. 오버 엔지니어링 여부를 확인한다 (한 feature에서만 쓰는 로직을 entities로 끌어올리는 등)

### 배치 제안 형식

```text
파일: useAddToCart.ts
레이어: features
도메인: cart (DOMAINS.md 참조)
경로 제안: src/features/cart/model/useAddToCart.ts
이유: 장바구니 담기라는 사용자 행위 단위이므로 features, cart 도메인 소유
```

---

## 공통 안티패턴 참고 (두 모드 모두 사용)

**오버 추상화**

```text
// ❌ feature 하나에서만 쓰는데 entities로 끌어올림
src/entities/cart-badge-count/

// ✅ 해당 feature 안에 둔다
src/features/cart/ui/CartBadge.tsx
```

**같은 레이어 슬라이스 간 직접 참조**

```text
// ❌
// src/features/cart/model/useCart.ts
import { useCheckout } from '@/features/checkout/model/useCheckout';

// ✅ 상위(app/widgets)에서 조립
// src/widgets/cart-summary/CartSummaryWidget.tsx
import { useCart } from '@/features/cart';
import { useCheckout } from '@/features/checkout';
```

**app 레이어에 비즈니스 로직**

```text
// ❌
// src/app/products/page.tsx 안에서 필터링/정렬 로직 직접 계산

// ✅ features에서 가져와 조립만
// src/app/products/page.tsx
import { ProductFilterWidget } from '@/widgets/product-filter';
```
