# CODE CONVENTIONS

## 1. 위에서 아래로 코드를 막힘없이 읽을 수 있게 작성한다.

- 상하 혹은 외부 컴포넌트로의 시점 이동을 최소화한다.
- 이름만 보고 무엇을 하는지 예측할 수 있게 한다. ([2. 네이밍](#2-이름을-보고-동작을-예측할-수-있게-네이밍한다) 참고)
- 복잡하거나 코드 양이 많은 로직은 추상화해 읽을 때 이해해야 하는 양이 많지 않도록 한다.
- 함수, 컴포넌트, hook의 추상화 수준을 비슷하게 맞춘다.
- UI와 코드가 1:1로 대응되게 해 코드를 보고 화면의 어디와 매치되는지 쉽게 파악할 수 있도록 한다.

## 2. 이름을 보고 동작을 예측할 수 있게 네이밍한다.

- 이름을 보고 상세 로직을 보지 않고도 어떤 내용이 있을 지 예측할 수 있게 한다.
- 핸들러는 밖에서 넘겨 받는 것은 `on*`으로 컴포넌트 내부 선언은 `handle*`로 구분해 이름만 보고 출처를 알 수 있게 한다.
- `data`, `temp`, `flag` 같은 무의미한 이름은 쓰지 않는다. profileData 등 정보를 담는다.

```ts
// ❌ 이름은 계산인데 실제로는 조회 — 이름과 동작이 안 맞는다
function usePriceCalculation() {
  return useSuspenseQuery(priceQuery);
}

// ✅ 하는 일에 맞는 이름
function useGetPriceInfo() {
  return useSuspenseQuery(priceQuery);
}
```

## 3. 하나의 책임만 가지도록 분리한다.

**하나의 컴포넌트, hook, 함수가 하나의 책임**만 갖도록 한다.

- 여러 책임이 한 곳에 얽히면 기능을 바꿀 때 서로 얽혀 고치기 어렵고 바꿔야 할 부분이 묻혀 놓치기 쉽다.
- 단, 함께 바뀌는 것은 함께 둔다. 연관된 코드가 흩어져 있으면 고칠 곳을 다 찾아다녀야 하고 빠뜨리기 쉽다.
- API 호출부는 순수하게 유지한다. 함수 내에 store, 세션 호출 등을 엮지 않고 호출부에서 조합한다.
- 컴포넌트는 자기 데이터를 직접 조회한다. 데이터를 조회할 수 있는 id만 있으면 props로 데이터를 전달받지 않고 쓰는 곳에서 불러와 사용한다.

```tsx
// ❌ 장바구니 추가 함수가 로그인 여부 확인과 API 호출 두 역할을 수행함
function addToCart(productId: string, requireLogin: boolean) {
  if (requireLogin && !isLoggedIn()) return openLoginSheet();
  return cartApi.add(productId);
}

addToCart(productId, true); // 호출부

// ✅ 장바구니 추가 함수는 API 호출만 하고 로그인 확인은 호출부에서
function addToCart(productId: string) {
  return cartApi.add(productId);
}

const onAddToCart = () => {
  if (!isLoggedIn()) return openLoginSheet();
  addToCart(productId);
};
```

## 4. 상태를 중복 없이 단일 출처에서 관리한다.

- state로부터 파생할 수 있는 값은 중복 state로 두지 않고 렌더 중 계산한다.
- 서버 데이터는 단일 출처에서 쓴다. 로컬 state로 복제하면 두 곳을 늘 같이 고쳐야 하는 문제가 있다.
- props, URL searchParam 등 외부 값을 state로 복사하지 않는다. 복사하면 원본이 바뀌어도 안 따라가 어긋난다.

```tsx
// ❌ 불필요한 상태
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(`${first} ${last}`);
}, [first, last]);

// ✅ 렌더 중 계산
const fullName = `${first} ${last}`;
```

```tsx
// ❌ props, URL searchParam 값을 state로 복사
const [keyword, setKeyword] = useState(query.keyword);

// ✅ 값을 직접 가져다 쓰기
<SearchInput key={query.keyword} defaultValue={query.keyword} />;
```

## 5. 서버와 통신할 때 다음을 고려한다.

- 업데이트 API를 호출한 뒤엔 관련 데이터를 갱신한다.
  - 응답 값으로 캐시를 갱신하거나 다시 조회한다 (예: `updateProfile` 후 응답으로 캐시 갱신 혹은 `getProfile` 재호출).
- 해피패스만 만들지 않고 로딩 / 에러 / 빈 상태를 모두 처리한다. 에러는 화면이 깨지지 않게 유저가 이해하고 다음 행동을 할 수 있게 보여준다.
- 에러는 메시지 파싱이 아니라 에러 코드로 분기한다.
- 업데이트 요청 버튼은 pending 중 비활성화해 중복 클릭과 중복 요청을 막는다.

```ts
// ❌ 메시지 문자열에 의존. 문구가 바뀌면 깨진다
if (err.message.includes('잔액')) showRecharge();

// ✅ 에러 코드로 분기
if (err.errorCode === 'INSUFFICIENT_BALANCE') showRecharge();
```

## 6. 타입을 정확하게 사용한다.

- 올 수 있는 값이 정해져 있으면 `string`이 아니라 `union type`으로 다룬다. 상수 리스트에서 타입을 뽑아낸다.
- `union type`엔 `Record`로 빠짐없는 맵을 만든다.
- 코어 타입에서 파생해 중복 정의를 없앤다.
  - `Pick`/`Omit`(필드 추리기), `ReturnType`(함수 반환 타입), `Partial`(부분 선택).

```ts
// ❌ string 비교시 'PENDIGN' 같은 오타도 통과하는 문제
let status: string;
if (status === 'PENDING') {
  /* ... */
}

// ✅ 상수 리스트에서 union 타입을 뽑아냄
const ORDER_STATUS = ['NEW', 'PENDING', 'PAID'] as const;
type OrderStatus = (typeof ORDER_STATUS)[number]; // 'NEW' | 'PENDING' | 'PAID'

// ✅ 코어 타입에서 파생해 Product가 바뀌면 ProductCard도 자동 반영
type Product = { id: string; name: string; price: number; stock: number };
type ProductCard = Pick<Product, 'id' | 'name' | 'price'>;

// ✅ union type엔 Record로 빠짐없는 맵
const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  NEW: '신규',
  PENDING: '대기',
  PAID: '결제완료',
};
```

## 7. 폴더는 도메인 단위로 구성한다.

- 파일을 종류(`components/`, `hooks/`)가 아니라 기능이나 도메인 단위로 묶는다. 함께 바뀌는 게 함께 있게 하기 위함 ([3. 책임 분리](#3-하나의-책임만-가지도록-분리한다)).
- 여러 기능이 공유하는 것만 공통 폴더 `shared`로 올린다.

## 8. 주석은 최소화하고 필요한 곳에만 작성한다.

- 주석은 기본적으로 달지 않는다. 무엇을 하는지는 코드와 이름으로 드러낸다.
- 주석은 코드로 드러나지 않는 외부 맥락, 의사 결정 이유, 일반적이지 않은 부분에만 남긴다.
- 판별 기준은 "이 주석을 지우면 코드를 이해하는데 어려움이 있는가?"
