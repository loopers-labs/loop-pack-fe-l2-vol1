# Domain과 API 경계

## When to read

외부 API 응답, DTO schema, domain model/value object, Repository, Service, TanStack Query cache 경계를 설계할 때 읽는다.

## Source of truth

Zod와 TanStack Query의 설치 버전은 `package.json`과 `pnpm-lock.yaml`, runtime 검증의 공통 규칙은 [`../conventions/runtime-boundaries.md`](../conventions/runtime-boundaries.md)가 우선한다. 도메인별 배치와 계층 책임은 이 문서가 판단 기준이다.

## Rules

외부 API 응답은 `unknown`으로 들어온다고 가정하고, API boundary에서 Zod schema로 검증한다. schema를 통과한 값은 DTO/plain object로 다루며, 도메인 규칙이 필요한 경우 entity model에서 domain model/value object로 변환한다.

- API 응답 형태는 DTO/plain object로 표현한다. DTO는 전송 형식의 이름과 모양을 보존하고, 도메인 규칙이나 메서드를 갖지 않는다.
- 금액, 기간, 장바구니 항목, 상품 가격처럼 검증/계산/포맷/비교/상태 전이가 있는 데이터는 domain model 또는 value object로 감싼다.
- DTO를 domain model/value object로 바꾸는 일은 API adapter, entity model, custom hook 같은 경계 근처에서 처리한다. React 컴포넌트 본문에서 `new Product(...)`, `new Money(...)`처럼 직접 인스턴스화하지 않는다.
- TanStack Query cache에는 기본적으로 검증된 DTO/plain object를 둔다. class instance를 cache 전반에 퍼뜨리면 직렬화, devtools, structural sharing, hydration 동작을 이해하기 어려워지므로 필요한 사용 지점에서 domain object로 변환한다.

### Repository와 Service 분리

entity의 api segment는 두 계층으로 나눈다.

- **Repository** (`ProductRepository.ts`): HTTP 데이터 접근만 담당한다. 공용 ky 인스턴스를 constructor로 주입받아 엔드포인트별 조회 메서드를 인스턴스 메서드로 노출한다. HTTP 경계 테스트에서는 테스트 origin으로 확장한 실제 client 요청을 MSW로 가로챈다.
- **Service** (`ProductService.ts`): Repository를 constructor로 주입받아 TanStack Query 설정(queryOptions)을 만든다. `queryKeyFactory` static 중첩 객체로 query key 계층을 관리한다. 비즈니스 로직이나 데이터 변환이 필요하면 Service에 둔다.

```txt
src/entities/product/api/
  ProductRepository.ts    # HTTP 접근 계층 (ky 호출, searchParams 조립)
  ProductService.ts       # Query 설정 계층 (queryOptions, queryKeyFactory)
```

entity root에는 Public API용 `index.ts`를 만들지 않는다. Service 인스턴스와 클래스는 실제 모듈 파일에서 named export하고, 사용처는 파일 경로를 직접 import한다. 테스트나 커스텀 구성이 필요할 때도 같은 파일에서 클래스를 import해 별도 인스턴스를 만든다.

```ts
import {
  ProductService,
  productEntity,
} from '@/entities/product/api/ProductService'
```

왜 정적 메서드 대신 인스턴스를 쓰는가:

- 테스트 시 Service에는 spy 대상 Repository를, Repository에는 테스트 origin으로 확장한 실제 API client를 constructor로 주입할 수 있다.
- 여러 인스턴스가 다른 api client(예: 인증 토큰이 다른 클라이언트)를 사용할 수 있다.
- 사용처가 클래스 내부 구조를 알 필요 없이 `productEntity.getHome()`만 호출한다.

```txt
src/entities/product/
  api/
    product.dto.ts
    product.schema.ts
    product.api.ts
  model/
    product.ts
    money.ts
```

권장 흐름:

1. `api`에서 raw response를 Zod schema로 `parse` 또는 `safeParse`한다.
2. schema 기반 DTO 타입은 `z.infer<typeof ProductDtoSchema>`로 만든다.
3. DTO를 그대로 UI에 흘리지 말고, 도메인 규칙이 있으면 `model`의 value object/domain model로 변환한다.
4. React 컴포넌트는 DTO 검증이나 domain object 생성 책임을 갖지 않는다.
5. TanStack Query cache에는 기본적으로 검증된 DTO/plain object를 저장하고, class instance는 필요한 경계에서만 만든다.

## Verification

- 외부 응답이 API boundary에서 Zod로 검증되는가?
- DTO가 전송 형태만 표현하고, 도메인 invariant는 model/value object가 소유하는가?
- HTTP 접근과 query 설정이 각각 Repository와 Service 책임으로 분리되는가?
- React 컴포넌트와 TanStack Query cache에 domain class instance가 불필요하게 퍼지지 않는가?

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```
