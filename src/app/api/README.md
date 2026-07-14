# src/app/api

4주차 mock 백엔드. 실제 DB 대신 Next.js Route Handler가 고정 데이터를 내려준다.

## 응답 형태 규칙

모든 route는 `{ <리소스명>: T[] }` 형태로 응답한다 — 예: `{ products: [...] }`, `{ sizes: [...] }`,
`{ options: [...] }`. 리소스가 하나뿐이라 배열을 최상위로 바로 내려도 되지만, 나중에 페이지네이션
메타(`nextCursor` 등)를 추가할 여지를 남기려고 항상 객체로 감싼다. 새 route를 추가할 때도 이 규칙을
따른다.

## 타입과 데이터

API와 UI가 함께 사용하는 옵션 타입은 `src/types/product-options.ts`처럼 양쪽에서 접근할 수 있는 중립적인 위치에 정의한다. `product-options.ts`는 현재 도메인에 맞춘 이름이며, 다루는 도메인과 타입 범위가 달라지면 파일명도 함께 변경할 수 있다. Route Handler가 Client Component 타입에 의존하거나 같은 타입을 여러 곳에서 다시 선언하지 않는다.

mock 데이터와 조회 함수는 `src/services/product-options.ts`에서 관리한다. Route Handler는 조회 결과를 HTTP 응답으로 변환하고, Server Component는 같은 조회 함수를 직접 호출한다. 서버 내부 데이터를 읽기 위해 자신의 Route Handler에 다시 HTTP 요청하지 않는다.
