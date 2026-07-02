---
name: component-review
description: React 컴포넌트 리팩토링에서 관심사 분리, 컴포넌트 경계, Custom Hook 책임, API 경계, 상태 분리, Effect 정당성, 분리 근거를 리뷰할 때 사용한다.
---

# Component Review

React 컴포넌트 리팩토링을 리뷰할 때 사용한다. 목적은 파일을 많이 나누는 것이 아니라, UI / 로직 / API / 유틸의 책임이 읽기 쉽게 분리되었는지 확인하는 것이다.

## 리뷰 목표

- 컴포넌트 파일만 봐도 화면 구조가 보여야 한다.
- Hook 파일만 봐도 기능 흐름과 상태 소유권이 보여야 한다.
- API 호출부만 봐도 endpoint, request params, response contract가 보여야 한다.
- 유틸은 재사용 가능한 순수 함수만 분리한다.
- 분리한 것뿐 아니라 분리하지 않은 것에도 근거가 있어야 한다.

## 경계 판단

### 변경 이유

- 서로 다른 이유로 바뀌는 코드는 같은 컴포넌트에 묶지 않는다.
- 가격 정책, API 요청, UI 배치, 입력 상태, 표시 포맷처럼 변경 이유가 다르면 분리 후보로 본다.
- 단, 변경 이유가 아직 가정뿐이라면 성급하게 분리하지 않는다.

### 구현과 조합

- 페이지나 큰 컴포넌트는 가능한 한 화면 구획을 조합하는 역할에 집중한다.
- 낮은 수준의 `input`, `button`, `map`, 조건부 렌더링이 한 파일에 과도하게 섞이면 분리 후보로 본다.
- 조합을 위한 분리인지, 단순히 파일 수만 늘리는 분리인지 구분한다.

### 큰 컴포넌트

- 한 컴포넌트가 상태 관리, API 호출, 계산, 이벤트 처리, UI 렌더링을 모두 맡으면 분리 후보로 본다.
- 큰 컴포넌트를 그대로 큰 Hook으로 옮긴 것은 좋은 분리가 아니다.
- 분리 후 각 단위가 한 문장으로 설명되는지 확인한다.

### 성급한 추상화

- 사용처가 적거나 역할이 다른 UI를 억지로 공통 컴포넌트로 묶지 않는다.
- 특정 variant에서만 의미 있는 props가 늘어나면 공통화가 잘못되었는지 확인한다.
- 새 요구사항이 올 때마다 props와 내부 분기가 늘어나는 컴포넌트는 역할별 위임을 검토한다.

## Props와 상태 표현

- Props는 적게 유지하고, 이름은 역할과 의미를 드러내야 한다.
- 동시에 참이면 안 되는 상태를 여러 boolean으로 표현하지 않는다.
- 여러 boolean 대신 enum 또는 union type으로 표현할 수 있는지 검토한다.
- props나 state에서 계산 가능한 값은 별도 state로 복사하지 않는다.
- 파생값을 `useEffect`로 동기화하지 않는다.

## Composition과 Context

- props 전달 깊이가 얕고 범위가 좁다면 Context를 도입하지 않는다.
- 멀리 떨어진 여러 컴포넌트가 같은 상태를 필요로 할 때만 Context 도입을 검토한다.
- 구조를 외부에서 조립해야 할 때만 `children` 또는 slot 패턴을 고려한다.
- props가 많다는 이유만으로 Context나 slot을 도입하지 않는다.

## Components

- 컴포넌트는 UI 렌더링과 이벤트 연결에 집중한다.
- 컴포넌트에서 API endpoint를 직접 호출하지 않는다.
- 서버 로딩, 에러, 재시도 흐름은 Hook 또는 전용 UI 컴포넌트로 분리할 수 있다.
- 페이지에 명확한 화면 구획이 있다면 구획 단위 컴포넌트로 나눈다.
- 파일 수를 늘리기 위한 작은 컴포넌트 추출은 피한다.
- JSX를 읽을 때 화면 구조가 먼저 보여야 한다.

## Hooks

- 각 Custom Hook은 한 문장으로 설명되어야 한다.
- Hook은 명확한 상태와 동작 조합을 가진다.
- Hook은 JSX나 스타일 객체를 반환하지 않는다.
- Hook은 여러 책임을 하나의 이름 뒤에 숨기지 않는다.
- Hook 설명에 "그리고"가 반복되면 분리 후보로 본다.
- Hook 이름은 역할을 드러내야 한다. 예: `useData`보다 `useProductListQuery`가 낫다.

## API 경계

- API endpoint는 컴포넌트 바깥에 둔다.
- request params와 response type은 API 호출 함수 근처에서 확인 가능해야 한다.
- query string 조립은 API 요청 세부사항이면 API 호출부에서 처리한다.
- Hook은 `fetch`나 `axios` 구현체보다 API 호출 함수에 의존한다.
- 컴포넌트는 서버 응답의 세부 구조를 직접 알지 않게 한다.

## Utils

- 같은 순수 로직이 반복되거나 도메인과 독립적인 함수만 유틸로 분리한다.
- 특정 Hook이나 Component의 내부 정책이면 같은 파일에 남긴다.
- JSX를 반환하는 helper는 유틸로 빼지 않는다.
- 파일 내부 private 함수로 충분한데 utils 객체나 namespace로 묶지 않는다.
- 유틸 분리는 "다른 곳에서도 쓴다" 또는 "도메인과 독립적이다"를 설명할 수 있어야 한다.

## 상태 분리

상태를 먼저 구분한다.

- 서버 상태: API에서 가져온 데이터, loading, error, retry, abort
- 클라이언트 상태: view mode, modal open, selected tab 같은 UI 상태
- URL 상태: 공유 가능한 filter, search, sort, page query param
- 파생값: 기존 상태에서 계산 가능한 값

규칙:

- 파생값은 특별한 이유 없이 state로 저장하지 않는다.
- 공유 가능한 필터 조건은 URL query string을 단일 출처로 둘 수 있다.
- 필터 변경 시 현재 page가 무효해질 수 있으면 page query를 초기화한다.
- 서버 상태는 request / success / failure 흐름으로 일관되게 다룬다.
- 이전 요청보다 늦게 끝난 응답이 최신 상태를 덮어쓰지 않게 방어한다.

## Effect 점검

모든 `useEffect`에 대해 확인한다.

- 외부 시스템과 동기화하는 Effect인가?
- API 요청, 구독, localStorage, history, scroll 같은 외부 작업인가?
- 렌더 중 계산 가능한 값을 Effect로 동기화하고 있지 않은가?
- 비동기 요청은 stale response 또는 abort를 방어하는가?
- cleanup이 실제 외부 작업을 정리하고 있는가?

## 분리 근거

모든 분리에는 한 줄 근거가 있어야 한다.

- 어떤 책임을 옮겼는가?
- 이 경계가 읽기 비용이나 변경 비용을 어떻게 줄이는가?
- 분리하지 않은 코드는 왜 그대로 두었는가?

예시:

- 상품 목록 API 요청 조립은 endpoint/query string 세부사항이므로 컴포넌트 밖으로 분리한다.
- URL query parser는 상품 목록 URL 상태 정책에 묶여 있어 Hook 내부에 둔다.
- localStorage number list 처리는 여러 Hook에서 반복되어 유틸로 분리한다.
- ProductCard의 badge 계산은 해당 카드 전용 표시 정책이라 같은 파일의 private helper로 둔다.

## 리뷰 출력 형식

리뷰할 때는 다음 순서로 답한다.

1. 문제점 우선, 심각도 순서
2. UI / Hooks / API / Utils 경계 평가
3. 서버 상태 / 클라이언트 상태 / URL 상태 / 파생값 평가
4. Effect 정당성 평가
5. 분리 근거가 부족한 지점
6. 다음으로 할 수 있는 가장 작은 리팩토링 제안

동작을 바꾸는 큰 rewrite보다, 현재 동작을 보존하는 작은 개선을 우선한다.
