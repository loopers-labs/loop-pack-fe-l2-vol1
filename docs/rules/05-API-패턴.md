# 05 — API 패턴

## When to read

Route Handler, API client, query function, query key factory, DTO 설계, domain model, Repository/Service, 서버/클라이언트 fetch를 작성하거나 변경할 때 읽는다.

## Source of truth

- HTTP 클라이언트와 버전: `package.json`, `pnpm-lock.yaml`
- Zod와 TanStack Query 설치 버전: `package.json`, `pnpm-lock.yaml`
- DTO와 model 배치, Repository/Service 분리: 본 문서 Rules
- 외부 입력 검증: 본 문서 Rules와 Zod

## Rules

### 1. 모든 런타임 입력은 경계에서 검증한다

- 서버 응답, route/search params, form payload, localStorage/sessionStorage, 환경 변수처럼 런타임에 깨질 수 있는 값은 경계에서 Zod schema로 검증한다.
- Zod는 `dependencies`에 둔다. 기본 import는 공식 문서와 맞춰 `import * as z from 'zod'`를 사용한다.

| ✅ 올바른 예                                   | ❌ 잘못된 예                          |
| ---------------------------------------------- | ------------------------------------- | --- | --- |
| `const parsed = productSchema.parse(response)` | `const product = response as Product` |
| `const result = pageParser.safeParse(rawPage)` | `const page = Number(rawPage)         |     | 1`  |

### 2. parse와 safeParse를 구분해서 사용한다

- 검증 실패를 즉시 예외로 처리해도 되는 경계에서는 `schema.parse(input)`을 사용한다.
- 사용자 피드백이나 분기 처리가 필요한 흐름에서는 `schema.safeParse(input)`으로 성공/실패를 명시적으로 나눈다.

```ts
// ✅ 올바른 예: 서버 응답은 깨지면 즉시 예외가 맞다
const product = productSchema.parse(response)

// ✅ 올바른 예: 사용자 입력은 실패 분기를 직접 처리한다
const result = searchSchema.safeParse(rawQuery)
if (!result.success) {
  showFieldErrors(result.error)
  return
}
```

### 3. schema에서 타입을 파생한다

- schema에서 파생되는 타입은 `z.infer<typeof Schema>`로 만든다.
- schema와 별도의 수동 타입을 중복 선언하지 않는다.

| ✅ 올바른 예                                                      | ❌ 잘못된 예                                          |
| ----------------------------------------------------------------- | ----------------------------------------------------- |
| `type Product = z.infer<typeof ProductSchema>;`                   | `interface Product { id: string; ... }` + 별도 schema |
| `type ProductListQuery = z.infer<typeof ProductListQuerySchema>;` | query 타입과 schema 필드가 따로 관리됨                |

### 4. query key는 데이터 식별자다

- query key는 조건별로 정확히 분리하고, 동일 입력에는 동일 key를 반환한다.
- 브라우저 query function만 TanStack Query의 `signal`을 HTTP client에 전달해 대체된 요청을 취소한다.
- 서버 측 native fetch memoization 검증 자격을 보존해야 하는 descriptor는 signal을 전달하지 않는다.

```ts
// ✅ 올바른 예
export const queryKeyFactory = {
  product: {
    list: (query: ProductListQuery) => ['products', 'list', query],
    detail: (id: string) => ['products', 'detail', id],
  },
};

// ❌ 잘못된 예: query key가 문자열 하나로만 구성됨
useQuery({ queryKey: ['products'], queryFn: ... });
```

### 5. DTO와 domain model을 분리한다

- 외부 API 응답은 `unknown`으로 들어온다고 가정하고, API boundary에서 Zod schema로 검증한다.
- schema를 통과한 값은 DTO/plain object로 다루며, 도메인 규칙이 필요한 경우 entity model에서 domain model/value object로 변환한다.
- DTO는 전송 형식의 이름과 모양을 보존하고, 도메인 규칙이나 메서드를 갖지 않는다.
- 금액, 기간, 장바구니 항목, 상품 가격처럼 검증/계산/포맷/비교/상태 전이가 있는 데이터는 domain model 또는 value object로 감싼다.

| 개념                      | 책임                  | 위치                                       |
| ------------------------- | --------------------- | ------------------------------------------ |
| DTO                       | 전송 형식 표현        | `entities/*/api/*.dto.ts`, `*.schema.ts`   |
| Domain model/value object | invariant, 계산, 포맷 | `entities/*/model/*.ts`                    |
| Adapter                   | DTO → domain 변환     | `entities/*/api/` 또는 `entities/*/model/` |

### 6. Repository와 Service로 HTTP 계층을 분리한다

- entity의 `api` segment는 두 계층으로 나눈다.
  - **Repository** (`ProductRepository.ts`): HTTP 데이터 접근만 담당. 공용 ky 인스턴스를 constructor로 주입받아 엔드포인트별 조회 메서드를 인스턴스 메서드로 노출.
  - **Service** (`ProductService.ts`): Repository를 constructor로 주입받아 TanStack Query 설정(`queryOptions`)을 만든다. `queryKeyFactory` static 중첩 객체로 query key 계층을 관리. 비즈니스 로직이나 데이터 변환이 필요하면 Service에 둔다.

```txt
src/entities/product/api/
  ProductRepository.ts    # HTTP 접근 계층
  ProductService.ts     # Query 설정 계층
```

- 왜 인스턴스를 쓰는가:
  - 테스트 시 Service에는 spy 대상 Repository를, Repository에는 테스트 origin으로 확장한 실제 API client를 constructor로 주입할 수 있다.
  - 여러 인스턴스가 다른 api client를 사용할 수 있다.
  - 사용처가 클래스 내부 구조를 알 필요 없이 `productEntity.getHome()`만 호출한다.

```ts
import {
  ProductService,
  productEntity,
} from '@/entities/product/api/ProductService'
```

### 7. 서버/클라이언트 fetch 계약을 구분한다

- Route Handler는 브라우저용 계약이지 서버 내부 로직의 단순 통로가 아니다.
- 서버 컴포넌트에서 직접 외부 API를 호출할 때와 Route Handler를 거칠 때의 경계를 명확히 한다.
- TanStack Query cache에는 기본적으로 검증된 DTO/plain object를 둔다. class instance를 cache 전반에 퍼뜨리면 직렬화, devtools, structural sharing, hydration 동작을 이해하기 어려워지므로 필요한 사용 지점에서 domain object로 변환한다.

| 위치                    | 책임                                                |
| ----------------------- | --------------------------------------------------- |
| `src/app/api/**`        | 외부 API 노출, 권한/키 관리, 브라우저용 DTO 변환    |
| `src/entities/**/api`   | 도메인별 Repository, Service, DTO schema, query key |
| `src/app/**/page.tsx`   | 필요 시 prefetch + dehydrate                        |
| `src/entities/**/model` | DTO → domain model/value object 변환                |

### 8. 권장 흐름

1. `api`에서 raw response를 Zod schema로 `parse` 또는 `safeParse`한다.
2. schema 기반 DTO 타입은 `z.infer<typeof ProductDtoSchema>`로 만든다.
3. DTO를 그대로 UI에 흘리지 말고, 도메인 규칙이 있으면 `model`의 value object/domain model로 변환한다.
4. React 컴포넌트는 DTO 검증이나 domain object 생성 책임을 갖지 않는다.
5. TanStack Query cache에는 기본적으로 검증된 DTO/plain object를 저장하고, class instance는 필요한 경계에서만 만든다.

## Verification

- 외부 입력이 type assertion 없이 schema를 통과한 뒤 사용되는지 확인한다.
- 사용자 피드백이 필요한 흐름이 `safeParse`의 실패 분기를 명시적으로 처리하는지 확인한다.
- query key가 조건별로 올바르게 분리되는지 확인한다.
- DTO가 전송 형태만 표현하고, 도메인 invariant는 model/value object가 소유하는가?
- HTTP 접근과 query 설정이 각각 Repository와 Service 책임으로 분리되는가?
- React 컴포넌트와 TanStack Query cache에 domain class instance가 불필요하게 퍼지지 않는가?

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
