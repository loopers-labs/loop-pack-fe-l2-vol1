# Import와 공개 경계

## When to read

코드를 co-locate하거나 폴더로 승격할 때, FSD 모듈을 import/export할 때, `index.ts` 또는 공용 유틸리티의 공개 경계를 정할 때 읽는다.

## Source of truth

import/export의 정적 제약은 `eslint.config.mjs`, 경로 alias는 `tsconfig*.json`이 우선한다. 공개 경계에 관한 저장소 정책은 이 문서가 판단 기준이다.

> **Local policy:** 일반적인 FSD 문서의 slice-root `index.ts` Public API 지침은 이 저장소의 직접 파일 import 정책을 덮어쓰지 않는다. 이 저장소는 slice/entity root 배럴을 금지하며, 폴더로 승격한 컴포넌트 내부에서 필요한 named export만 모으는 `index.ts`만 예외로 허용한다.

## Rules

### Co-location과 폴더 승격

하나의 기능/화면/도메인 조각을 위해 함께 움직이는 코드는 처음에는 한 파일에 둔다. 해당 컴포넌트나 동작에만 쓰이는 타입, 상수, 작은 유틸리티 함수, 하위 표현 컴포넌트는 같은 파일 안에서 가까이 배치해 변경 맥락을 유지한다.

상태와 상태를 사용하는 로직이 생기면 같은 파일 안의 private custom hook으로 먼저 분리한다. 훅이 길어지거나 같은 slice 안에서 재사용되면 폴더로 승격해 `model` segment나 해당 컴포넌트 폴더의 hook 파일로 옮긴다.

파일이 커지거나 책임이 분리되기 시작하면 그때 폴더로 승격한다.

```txt
src/features/add-to-cart/ui/add-to-cart-button/
  index.ts                       # 선택적 컴포넌트 공개 경계
  add-to-cart-button.tsx
  add-to-cart-button.types.ts
  add-to-cart-button.constants.ts
  add-to-cart-button.utils.ts
```

폴더로 승격한 컴포넌트의 외부 공개 계약은 해당 컴포넌트 폴더의 `index.ts`에서 필요한 named export만 명시할 수 있다. 이것이 이 저장소에서 허용하는 유일한 `index.ts` 공개 경계다. `export *`는 사용하지 않으며 내부 타입, 상수, 유틸리티, 보조 컴포넌트는 외부에서 직접 import하지 않는다.

폴더 승격 기준:

- 파일이 길어져 리뷰에서 한 번에 맥락을 파악하기 어려운가?
- 타입, 상수, 유틸리티, 하위 컴포넌트가 서로 다른 속도로 변경되는가?
- 상태 전이, effect, 파생값 계산, 이벤트 핸들러가 컴포넌트 본문을 가리고 있는가?
- 일부 코드가 같은 slice 안의 다른 파일에서도 재사용되는가?
- 테스트나 Storybook 등 보조 파일을 같은 단위로 묶어야 하는가?

반대로 재사용되지 않는 작은 타입/상수/유틸리티를 습관적으로 별도 파일로 빼지 않는다. 파일 수를 늘리는 것보다 변경 맥락을 보존하는 것을 우선한다.

### 유틸리티 그룹화

`lib` segment의 유틸리티는 비슷한 동작끼리 namespace class의 static method로 묶는다. 흩어진 top-level 함수 모음보다 `MoneyUtils.format`, `DateRangeUtils.contains`처럼 호출 이름에서 맥락이 드러나는 형태를 우선한다.

```ts
export class MoneyUtils {
  private constructor() {}

  static format(value: number) {
    return new Intl.NumberFormat('ko-KR').format(value)
  }
}
```

단일 컴포넌트/함수에만 쓰이는 private helper는 해당 파일 안에 둘 수 있다. slice 밖으로 공개되는 공용 유틸리티는 top-level standalone 함수로 export하지 않고 namespace class의 static method로 공개한다. 단, React custom hook은 hook 규약을 따르기 위해 `use[A-Z0-9]...` 이름의 standalone function으로 공개할 수 있다.

### 직접 import

이 저장소는 slice root와 entity root에 `index.ts` 배럴 익스포트를 사용하지 않는다. slice 외부에서는 모듈의 실제 파일 경로를 직접 import한다. 폴더로 승격한 컴포넌트 내부의 `index.ts`만 필요한 named export를 모으는 공개 경계로 선택할 수 있으며, 그 외 모듈은 직접 import한다.

```ts
// 권장
import { AddToCartButton } from '@/features/cart/ui/AddToCartButton'
import { useCartStore, cartSelectors } from '@/features/cart/model/CartStore'
import { productEntity } from '@/entities/product/api/ProductService'

// 금지
import { AddToCartButton } from '@/features/cart'
import { useCartStore } from '@/features/cart'
```

이유:

- root `index.ts`가 없으면 IDE에서 "Go to Definition"이 실제 파일로 바로 이동한다.
- 트리쉐이킹이 불확실해지는 문제를 피한다.
- 사용하지 않는 export가 번들에 포함되는 것을 막는다.
- slice의 공개 계약이 파일 시스템 구조로 드러나며, 변경 시 import 경로가 명시적으로 바뀌어 영향 범위가 보인다.

## Verification

- 공개되지 않은 다른 slice의 내부 구현을 import하지 않았는가?
- slice/entity root에 `index.ts` 배럴 익스포트를 만들지 않았는가?
- 실제 파일 경로로 import하는가?
- 컴포넌트 폴더의 선택적 `index.ts`가 named export만 명시하고 내부 구현과 `export *`를 노출하지 않는가?

```bash
pnpm lint
pnpm typecheck
```
