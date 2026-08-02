---
name: component-review
description: 코드를 목적에 맞게 분리 했는지 검토 요청시 다음 skill 기준으로 판별한다.
---

### 리뷰 결과 형태

파일명 | 내용 으로 정리한다
개선안은 "현재 구조의 장점 / 개선 포인트 / 대안" 형태로 제시한다

```text
orderHeader.tsx | 검색 로직이 UI단에 있어 분리 필요
```

---

### 분석 순서

1. 파일이 어느 레이어에 속하는지 판단한다 (components / hooks / services / utils)
2. 각 레이어 기준에 맞는 책임만 갖고 있는지 확인한다
3. 상태를 서버 상태 / 클라이언트 상태 / 파생값으로 분류한다
4. 의존 방향을 확인한다 — 구체적인 구현체(axios, fetch)에 직접 의존하는지
5. 오버 추상화 여부를 확인한다

---

### 판단 기준

**대전제 — 오버 추상화 지양**

- 한 컴포넌트에서만 쓰이는 경우
- 분리 했을 때 추적 비용이 더 커지는 경우
- useState 하나 감싸기 위한 레이어 생성

**components**

- ✅ components 레이어만 보면 화면이 그려져야 한다
- ✅ JSX 렌더링, 이벤트 바인딩
- ✅ 화면을 제어하는 상태 존재 가능
- ✅ draft 상태는 계산·검증이 없다면 화면 제어 상태로 본다
- ❌ axios, fetch 직접 호출
- ❌ 비즈니스 로직 (필터 계산, 검색, 페이지네이션 등)

**hooks**

- ✅ hooks 레이어만 보면 기능이 이해되어야 한다
- ✅ use 키워드로 파일명 시작
- ✅ 하나의 비즈니스 로직으로 구성
- ✅ JSX와 무관한 로직
- ✅ 추상화된 레이어(service)를 통해 호출
- ✅ 비즈니스 로직 포함 (필터 계산, 검색, 페이지네이션 등)
- ✅ 유효성 검증
- ✅ loading, error, 캐싱, 재요청 등 서버 상태 관리를 위임
- ✅ 파생값은 useState + useEffect 대신 변수로 처리
- ❌ JSX 반환
- ❌ axios, fetch 직접 호출

**services**

- ✅ services 레이어만 보면 서버 통신이 파악되어야 한다
- ✅ API 호출 함수
- ✅ 요청/응답 형태 변환
- ✅ 공통 에러 변환
- ❌ useState, useEffect 등 Hook 사용

**utils**

- ✅ 순수 함수 (같은 입력 → 항상 같은 출력)
- ✅ 중복되는 곳이 2곳 이상인 경우 작성
- ✅ export function `함수명`(){} 형태
- ❌ JSX 반환
- ❌ useState, useEffect 등 Hook 사용
- ❌ 외부 상태 의존

---

### 안티패턴 체크

**파생값을 state로 관리**

```text
// ❌
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// ✅
const fullName = `${firstName} ${lastName}`;
```

**View가 도메인 로직을 직접 판단**

```text
// ❌
function StatusTag({ isPaid, isPreparing, isShipped }: Props) {
  let color = '#9ca3af';
  if (isPaid) color = '#3b82f6';
  return {label};
}

// ✅
function Tag({ label, color }: Props) {
  return {label};
}
```

**복잡한 조건에 이름 없음**

```text
// ❌
if (user.age >= 18 && user.hasVerifiedEmail && !user.isBanned) { }

// ✅
const canPurchase = user.age >= 18 && user.hasVerifiedEmail && !user.isBanned;
if (canPurchase) { }
```

**구현체에 직접 의존 (DIP 위반)**

```text
// ❌
import axios from 'axios';
function useProductList() {
  useEffect(() => { axios.get('/api/products') }, [])
}

// ✅
function useProductList() {
  useEffect(() => { productService.getProducts() }, [])
}
```

**prop 변경 동기화에 useEffect 사용**

```text
// ❌
useEffect(() => { setDraftValue(value); }, [value]);

// ✅
const [prevValue, setPrevValue] = useState(value);
if (value !== prevValue) {
  setPrevValue(value);
  setDraftValue(value);
}
```

**순수 함수가 아닌 utils**

```text
// ❌
const isNew = (createdAt: string) => {
  const days = (new Date().getTime() - new Date(createdAt).getTime()) / MS_PER_DAY;
  return days <= NEW_PRODUCT_DAYS;
};

// ✅
const formatPrice = (price: number) => price.toLocaleString() + '원';
```

**UI 영역 기준으로 Hook 경계를 긋는 경우**

```text
// ❌
useFilterSection()

// ✅
useProductFilters()
```

---

### 개선안 제시 형식

1. **현재 구조의 장점** — 지금 코드에서 잘 된 부분
2. **개선 포인트** — 레이어 기준 또는 안티패턴 기준으로 문제가 되는 부분
3. **대안** — 어떻게 바꾸면 좋은지 방향 제시 (코드 전체를 짜주지 않고 구조만)

```text
FilterSection.tsx |
현재 장점: draft 상태로 입력 즉시성을 확보한 점이 좋다
개선 포인트: INITIAL_FILTER_VALUES가 페이지·섹션·draft 세 곳에 흩어져 있어 필터 관심사가 분산됨
대안: useProductFilters Hook으로 초기값과 적용된 필터/리셋 규칙을 한 곳에 모으고, FilterSection은 props로 받는 구조로 변경
```
