---
name: api-convention
description: 도메인별 API 호출 계층(api / queries / service) 작성 컨벤션. fetch 함수, TanStack Query queryOptions·mutationOptions, 소비 훅을 어떤 파일에 어떤 형태로 둘지 정한다.
---

# API 호출 컨벤션

도메인별로 API 관련 코드를 세 파일로 나눈다. 통신, 쿼리 설정, 소비 훅을 각각 분리해 책임을 명확히 한다.

```
src/api/<도메인>/
  model.ts     # 파라미터 / 응답 타입
  api.ts       # fetch 함수 (통신 구현)
  queries.ts   # queryKey 팩토리 + queryOptions / mutationOptions
  service.ts   # 컴포넌트가 쓰는 훅 (useQuery / useMutation 래핑)
```

의존 방향은 `service.ts → queries.ts → api.ts → model.ts` 한 방향이다. 컴포넌트는 `service.ts`의 훅만 import 하고, `api.ts`의 fetch 함수를 직접 부르지 않는다(DIP).

## `model.ts` — 파라미터 / 응답 타입

파라미터·응답 타입은 도메인의 `model.ts` 한 곳에 정의하고 나머지 세 파일이 모두 이를 참조한다.

네이밍 규칙:

- **Get 호출**이면 prefix `Get`: `GetProductListParams`, `GetProductListResponse`
- **Query Params**로 보내면 suffix `Params`
- **Body**로 보내면 suffix `Request`
- **응답값**이면 suffix `Response`

```ts
export type GetProductListParams = {
  category: string
  sort: string
  q: string
  page: string
  size: string
  minPrice?: string
  maxPrice?: string
  inStock?: string
}

export type GetProductListResponse = {
  products: Product[]
  totalCount: number
}
```

Query Params 타입은 `URLSearchParams`에 넣을 수 있도록 값이 모두 `string`이다. 선택 파라미터는 `?`로 둔다.

## `api.ts` — fetch 함수

- 함수명은 `동사 + 목적어`: `getHome`, `getProductList`, `createProductItem`
- `async` 화살표 함수로 작성하고 named export 한다
- `response.ok`를 반드시 확인하고, 실패 시 사용자에게 보여줄 메시지와 status를 담아 `throw` 한다 (빈 catch·무시 금지)
- 반환 타입은 실제 응답 타입으로 정확히 캐스팅한다

```ts
export const getHome = async (params: GetHomeParams): Promise<GetHomeResponse> => {
  const searchParams = new URLSearchParams(params)

  const response = await fetch(`/api/home?${searchParams.toString()}`)
  if (!response.ok) {
    throw new Error(`홈 정보를 불러오지 못했습니다 (status: ${response.status})`)
  }

  return response.json() as Promise<GetHomeResponse>
}
```

- `URLSearchParams(params)`에 넘기는 params는 `Record<string, string>` 형태여야 한다. number·boolean·배열이 섞이면 직렬화 유틸을 별도로 두고 그걸 거친다.

## `queries.ts` — queryKey + query/mutation 옵션

### queryKey 팩토리

- `all`은 도메인 루트 키 **배열**이다 (함수 아님)
- 파생 키는 `[...도메인QueryKeys.all, '구분자', 인자]`로 확장한다
- `as const`로 튜플 타입을 좁힌다

```ts
export const productQueryKeys = {
  all: ['product'] as const,
  list: (query: GetProductListParams) => [...productQueryKeys.all, 'list', query] as const,
}
```

### query / mutation 옵션

- 조회는 `queryOptions`, 변경은 `mutationOptions`로 감싼다 (v5.80+)
- 목록처럼 파라미터가 바뀌며 재조회되는 쿼리는 `placeholderData: keepPreviousData`로 깜빡임을 막는다
- mutation 키 필드명은 `mutationKey`다

```ts
import { queryOptions, mutationOptions, keepPreviousData } from '@tanstack/react-query'

export const productQueries = {
  list: (query: GetProductListParams) =>
    queryOptions({
      queryKey: productQueryKeys.list(query),
      queryFn: () => getProductList(query),
      placeholderData: keepPreviousData,
    }),
}

export const productMutations = {
  create: () =>
    mutationOptions({
      mutationKey: [...productQueryKeys.all, 'create'],
      mutationFn: createProductItem,
    }),
}
```

## `service.ts` — 소비 훅

- 컴포넌트가 import 하는 유일한 계층
- 훅 이름은 `use + 행위 + Query / Mutation`: 조회는 `Query`, 변경은 `Mutation` suffix로 훅의 성격을 이름에 드러낸다 (`useHomeQuery`, `useProductListQuery`, `useProductCreateMutation`)
- `queries.ts`의 옵션을 `useQuery` / `useSuspenseQuery` / `useMutation`에 그대로 넘긴다
- 여기서 통신·쿼리 설정을 다시 만들지 않는다

같은 query 옵션을 `useQuery`로도 `useSuspenseQuery`로도 쓸 수 있다. Suspense 경계(`loading.tsx` / `<Suspense>`)에 맡길 화면은 `useSuspenseQuery`를, `data` undefined를 직접 다뤄야 하면 `useQuery`를 쓴다. Suspense 변형은 `use + Suspense + 행위 + Query`로 둔다.

```ts
import { useQuery, useSuspenseQuery, useMutation } from '@tanstack/react-query'

export const useProductListQuery = (params: GetProductListParams) =>
  useQuery(productQueries.list(params))

export const useSuspenseProductListQuery = (params: GetProductListParams) =>
  useSuspenseQuery(productQueries.list(params))

export const useProductCreateMutation = () => useMutation(productMutations.create())
```

## 체크리스트

- [ ] `api.ts`에서 `response.ok`를 확인하고 실패 시 throw 하는가
- [ ] 컴포넌트가 `service.ts` 훅만 쓰고 `api.ts`를 직접 부르지 않는가
- [ ] queryKey `all`을 배열로 두고 파생 키가 이를 확장하는가
- [ ] 파라미터·응답 타입이 `model.ts` 한 곳에서 관리되는가
- [ ] 타입 네이밍이 규칙(Get / Params / Request / Response)을 따르는가
- [ ] mutation 필드명이 `mutationKey` / `mutationFn`인가
- [ ] `service.ts` 훅 이름이 `use + 행위 + Query / Mutation`을 따르는가

---

_이 문서는 사용자가 제시한 예시 코드를 AI(Claude)가 분석·정리해 작성했다. 예시의 오타(`useMutate`, `mutateKey`, `productQueryKeys.all()` 함수 호출, 응답 타입 불일치)는 실제 TanStack Query v5 API에 맞게 바로잡았다._
