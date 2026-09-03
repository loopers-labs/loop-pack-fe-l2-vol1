# Week 08 테스트 자가 검증 기록

## 실험 원칙

- Step 2 커밋 `af3e6772`를 정상 기준점으로
- 테스트 코드는 그대로 둔 채 구현 코드 한 곳을 변경한 후 관련 테스트 진행
- 실험을 위해 변경한 구현 코드는 저장하지 않고 테스트 완료 후 즉시 복구
- 코드를 변경했음에도 불구하고 통과된 테스트 코드의 경우 보강 후 재테스트 진행

## 실험 결과 요약

| #   | 방법론 | 망가뜨린 곳                                                                | 어떻게 바꿨나                                     | 결과                    | 실패한 테스트                                                                                                                                                                                                                             |
| --- | ------ | -------------------------------------------------------------------------- | ------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 단위   | `src/shared/lib/set.ts`의 `toggleSetItem`                                  | 상품 존재 여부 조건 `set.has(item)`을 반대로 변경 | 잡힘                    | `없는 상품 ID를 추가하고 원본 Set은 변경하지 않는다`<br>`이미 있는 상품 ID를 제거하고 원본 Set은 변경하지 않는다`                                                                                                                         |
| 2   | 통합   | `src/entities/product/api/productsQueryOptions.ts`의 query key             | query key의 `category`를 `undefined`로 변경       | 잡힘                    | `URL에 조건이 없으면 기본값으로 해석되고, 그 값이 query key에도 그대로 반영된다`<br>`URL에 담긴 조건이 그대로 파싱되고, 그 값이 query key에도 동일하게 반영된다`                                                                          |
| 3   | 통합   | `src/features/product-filter/model/useProductListParams.ts`의 `resetQuery` | 초기화 값에서 `page`를 제외                       | 살아남음 → 보강 후 잡힘 | 보강 전: 초기화 후 `page=2`가 URL과 API 요청 및 화면에 남아 테스트가 실패할 것으로 예상했지만 12개 테스트가 모두 통과<br>보강 후: `검색/카테고리/정렬과 2페이지를 함께 초기화하면 모든 조건을 제거하고 1페이지 기본 목록을 표시한다` 실패 |
| 4   | E2E    | `src/features/product-filter/model/useProductListParams.ts`의 history 설정 | 기본 history를 `push`에서 `replace`로 변경        | 잡힘                    | `여러 필터 history에서 뒤로/앞으로 이동하면 각 시점의 URL과 필터 및 목록을 복원한다`                                                                                                                                                      |

## 1. 단위: 상품 ID 토글 분기 반전

### 변경

`toggleSetItem`의 `if (set.has(item))`을 `if (!set.has(item))`으로 바꿨다. 상품 ID가 있으면 제거하고 없으면 추가해야 하는 두 분기를 동시에 반대로 동작하게 만든 변경이다.

```text
// 변경 전
if (set.has(item))

// 변경 후
if (!set.has(item))
```

### 결과

- `없는 상품 ID를 추가하고 원본 Set은 변경하지 않는다` 실패
- `이미 있는 상품 ID를 제거하고 원본 Set은 변경하지 않는다` 실패
- Set 직렬화/복원 테스트 2개는 통과

결과는 4개 중 2개 실패, 2개 통과였다. 실패 메시지에 없는 ID가 결과 Set에 추가되지 않은 차이와 기존 ID가 제거되지 않은 차이가 각각 표시됐다. 테스트 이름과 Set diff만으로 추가/제거 조건이 뒤집혔음을 추측할 수 있었다.

구현을 복구한 뒤 `set.test.ts`의 4개 테스트가 모두 다시 통과했다.

## 2. 통합: query key에서 카테고리 제거

### 변경

상품 API 요청에 전달하는 `query`는 유지하고, React Query의 query key에 포함되는 객체에서만 `category`를 `undefined`로 변경했다. 요청 조건은 같아도 서로 다른 카테고리가 같은 캐시 항목으로 취급될 수 있는 결함을 만들었다.

```text
// 변경 전
queryKey: ['products', query];

// 변경 후
queryKey: ['products', { ...query, category: undefined }];
```

### 결과

- `URL에 조건이 없으면 기본값으로 해석되고, 그 값이 query key에도 그대로 반영된다` 실패
- `URL에 담긴 조건이 그대로 파싱되고, 그 값이 query key에도 동일하게 반영된다` 실패
- 0/음수 페이지 하한 보정 테스트 2개는 통과

결과는 4개 중 2개 실패, 2개 통과였다. 실패 diff에 query key의 `category`가 `all` 또는 `casual`에서 `undefined`로 바뀐 사실이 직접 나타나 원인을 알 수 있었다.

구현을 복구한 뒤 `useProductListParams.test.tsx`의 4개 테스트가 모두 다시 통과했다.

## 3. 통합: 초기화에서 페이지 제외

### 변경

`resetQuery`가 검색어, 카테고리와 정렬만 기본값으로 바꾸고 `page`는 전달하지 않도록 변경했다. 테스트 코드는 그대로 두고 `ProductView.test.tsx`를 실행했지만 12개 테스트가 모두 통과했다.

```text
// 변경 전
const resetQuery = () => setParam(DEFAULT_PRODUCT_LIST_QUERY);

// 변경 후
const resetQuery = () =>
  setParam({
    q: DEFAULT_PRODUCT_LIST_QUERY.q,
    category: DEFAULT_PRODUCT_LIST_QUERY.category,
    sort: DEFAULT_PRODUCT_LIST_QUERY.sort,
  });
```

### 최초 결과

변경이 살아남은 원인은 초기화 테스트의 MSW 기본 응답이 총 1페이지뿐이었기 때문이다. `resetQuery`가 2페이지를 남겨도 `ProductView`의 범위 초과 페이지 보정이 총 페이지 수를 확인한 뒤 다시 1페이지로 이동했다. 초기화 구현이 잘못됐지만 다른 보정 로직이 결과를 우연히 정상처럼 만들었다.

### 테스트 보강

기본 조건에서도 2페이지가 유효하도록 응답을 다음과 같이 구분했다.

- 기본 조건 1페이지: 첫 번째 기본 상품, `1 / 2`
- 기본 조건 2페이지: 두 번째 기본 상품, `2 / 2`

이제 페이지 2가 남아도 범위 초과 보정이 개입하지 않는다. 정상 구현에서는 초기화 후 기본 조건의 첫 번째 상품과 `1 / 2`가 표시되는지 확인한다.

```text
const isSecondDefaultPage =
  query.q === null && query.category === null && query.sort === 'latest' && query.page === '2';

if (isSecondDefaultPage) {
  return HttpResponse.json(
    productListResponse([CASUAL_SECOND], { page: 2, pageSize: 1, totalCount: 2 }),
  );
}

return HttpResponse.json(
  productListResponse([CASUAL_FIRST], { page: 1, pageSize: 1, totalCount: 2 }),
);

expect(await screen.findByRole('heading', { name: CASUAL_FIRST.name })).toBeInTheDocument();
expect(screen.getByText('1 / 2')).toBeInTheDocument();
```

2페이지 요청에는 `CASUAL_SECOND`를, 1페이지 요청에는 `CASUAL_FIRST`를 응답해 페이지별 결과를 구분했다. 초기화 후에는 1페이지 상품과 `1 / 2`가 표시되는지를 확인하도록 보강했다.

### 같은 변경을 다시 적용한 결과

보강 후 `resetQuery`에서 다시 `page`를 제외하자 복합 조건 초기화 경계 테스트가 실패했다. 실패 메시지는 초기화 후 기대한 1페이지 상품을 찾지 못했다고 표시했고, 출력된 DOM에는 2페이지 상품과 `2 / 2`가 남아 있었다. 이를 통해 페이지 초기화 누락을 원인으로 추측할 수 있었다.

구현을 복구한 뒤 보강된 `ProductView.test.tsx`의 12개 테스트가 모두 통과했다.

## 4. E2E: history 방식을 replace로 변경

### 변경

`useQueryStates`의 기본 history 방식을 `push`에서 `replace`로 변경했다. 카테고리와 정렬을 바꿔도 새로운 history 항목을 추가하지 않고 현재 항목을 덮어쓰게 했다.

```text
// 변경 전
const [param, setParam] = useQueryStates(productSearchParams, {
  history: 'push',
  scroll: true,
});

// 변경 후
const [param, setParam] = useQueryStates(productSearchParams, {
  history: 'replace',
  scroll: true,
});
```

### 결과

production build에서 `여러 필터 history에서 뒤로/앞으로 이동하면 각 시점의 URL과 필터 및 목록을 복원한다` 테스트가 실패했다. 첫 번째 `goBack()` 뒤 URL의 카테고리가 `casual`이어야 했지만 실제 값은 `null`이었다.

실패 메시지에 `Expected: casual`, `Received: null`과 `expectSearchParam`의 실패 위치가 함께 표시되어 history가 쌓이지 않았다는 원인을 추측할 수 있었다.

설정을 `push`로 복구한 뒤 같은 production E2E가 다시 통과했다.

## 최종 복구와 검증

- `toggleSetItem`의 조건을 원래대로 복구했다.
- query key에 전체 query가 포함되도록 복구했다.
- `resetQuery`가 `DEFAULT_PRODUCT_LIST_QUERY` 전체를 적용하도록 복구했다.
- history 기본값을 `push`로 복구했다.
- 살아남은 초기화 변형을 잡기 위한 MSW 응답과 경계 단언만 최종 테스트 변경으로 남겼다.

최종 전체 검증 결과는 다음과 같다.

- `pnpm check` 통과
  - Vitest 26개 파일, 113개 테스트 통과
  - ESLint 오류 0개, 기존 warning 61개
  - TypeScript typecheck 통과
  - Next.js production build 통과
- `pnpm test:e2e` 통과
  - production Chromium E2E 5개 테스트 통과
