# CONVENTION.md

> 프로젝트 구조·컨벤션과 그 "왜"를 사람이 파악하기 위한 문서.
> AI 코드 생성 규칙(요약)은 `CLAUDE.md` 참고.

---

## 📁 폴더 구조 규칙 (FSD)

레이어로 나눠 **변경 파급을 가둔다** — 위 레이어만 아래를 알고, 아래는 위를 모른다.

- **레이어.** `app`(라우팅) → `views`(화면 조합) → `widgets`(합성 UI 블록) → `features`(도메인 단위) → `entities`(도메인 상태·모델) → `shared`(재사용 프리미티브·유틸). import는 **아래로만** 흐른다. 역참조·순환은 곧 경계가 깨졌다는 신호.
- **`entities`는 도메인 상태의 집.** 장바구니·위시리스트처럼 여러 features·views가 공유하는 도메인 상태를 둔다. shared(프리미티브)도 features(단위 기능)도 아닌, 모두가 아래에서 import하는 위치가 필요해 5주차에 추가했다. zustand 모듈 싱글턴처럼 Provider 없이 공유되는 상태의 자리다.
- **`widgets`는 합성 UI 블록.** 헤더처럼 여러 화면이 공유하며 entities·features를 조합하는 UI를 둔다. 한 화면 전용이면 그 화면(views) 안에 둔다.
- **레이어 안은 segment로.** `ui`(컴포넌트) / `model`(타입·상태) / `api`(데이터 접근) / `lib`(로직·유틸). 도메인 타입·store·그 selector 훅은 `model`에, JSX 없는 범용 헤드리스 훅은 `lib`에. `shared`는 slice 없이 segment를 바로 둔다.
- **폴더는 kebab-case, 파일은 PascalCase**(컴포넌트명). 폴더를 소문자로 통일하면 OS 간 대소문자 충돌(Linux CI에서만 터지는 버그)을 막는다. CSS 모듈도 `Xxx.module.css`로 1:1.
- **import는 절대경로(`@/`).** 슬라이스를 옮겨도 참조가 안 깨진다. 같은 폴더의 CSS(`*.module.css`·`globals.css`)만 상대경로 예외 — 파일과 함께 움직이는 자산이라 이동에 안 깨진다. 테스트가 대상을 `./`로 부르는 건 예외가 아니다. `src/` 밖(루트 설정·`scripts/`)은 `@/` alias가 없어 상대경로를 쓴다.

## 🎨 CSS 전략

- **Tailwind 우선.** 레이아웃·간격·색·상태 변형(`data-[highlighted]`, `aria-expanded`)은 유틸리티로 표현한다.
- **CSS Module은 Tailwind가 못 쓰는 것만.** `@keyframes`(shimmer 등)처럼 유틸리티로 안 되는 것만 `*.module.css`에 두고 컴포넌트에 콜로케이트한다. 클래스·키프레임명이 자동 스코프돼 충돌이 없다.
- **모듈 클래스명은 camelCase.** 여러 단어 클래스는 하이픈(`addr-summary`)이면 점 표기로 못 읽으므로(`styles.addr-summary` → 뺄셈으로 해석) `addrSummary`로 둔다.

## ✍️ 네이밍이 이런 이유

- **`on~`(콜백 prop) / `handle~`(핸들러).** 방향을 드러내기 위함. `on~`은 자식→부모로 올라가는 이벤트 선언, `handle~`은 그 처리 구현.
- **props 타입을 `컴포넌트명+Props`로 분리.** 시그니처가 짧아지고 검색·재사용이 쉽다.
- **의미 기반 네이밍.** 구현이 바뀌어도 이름이 어긋나지 않게(`section`이 아니라 `card`).

## 🧩 컴포넌트 패턴

- **마크업 의미.** `<section>`은 이름 있는 문서 구획에만 쓴다. 단순한 시각적 그룹은 `<div>`로 두고, `<section>`을 중첩·남용하지 않는다 — 문서 아웃라인과 테스트 조회가 흐려진다.
- **상태 소유권.** "이 값을 누가 읽는가"로 위치를 정한다. 입력 중 임시값은 자식이, 여러 곳이 읽는 결과값은 공통 부모가 소유. (상세 규칙은 `CLAUDE.md`)
- **Compound + 이중 API(Dialog).** `Dialog.Trigger/Overlay/Panel/...`을 Context로 조립한다. 머리말·버튼 구성이 호출처마다 달라 조각 배치를 호출자에게 위임하기 때문. 열림 상태는 `open` prop 유무로 controlled/uncontrolled를 한 컴포넌트에서 판별하고, 통보는 `onOpenChange` 하나로 모은다 — 창구가 둘(`onClose`+`onOpenChange`)이면 동기화가 어긋난다. 스크롤 잠금과 Esc 이펙트는 분리한다: `setOpen` 정체성이 바뀌어 잠금 이펙트가 재실행되면 원복값이 오염된다.
- **Headless prop-getter(Select).** 키보드·포커스·타입어헤드·aria를 `useSelect` 훅에 몰고 `getToggleButtonProps`/`getMenuProps`/`getItemProps`로 내린다. 뷰는 훅이 실어 보낸 `data-*`만 읽어 스타일링 → 같은 로직 위에 생김새가 다른 여러 뷰(Size/Text/Thumbnail)를 얹는다.

## 🗂️ 데이터·상태 계층

- **Source of truth로 저장소를 고른다.** 도구를 먼저 고르지 않는다. 서버가 원본이면 TanStack Query, 공유·새로고침·앞뒤 이동으로 복원돼야 하면 URL(nuqs), 여러 페이지가 함께 쓰는 익명 상태면 Zustand, 한 컴포넌트의 확정 전 입력이면 React 로컬. 같은 값이라도 "누가 정하느냐"가 바뀌면 소유자가 바뀐다(고정 pageSize → 사용자 선택이 되면 URL로).
- **queryOptions는 정의, 실행은 호출부.** 팩토리는 key·queryFn·staleTime만 묶고, `useQuery`·서버 `prefetchQuery`·다음 페이지 prefetch가 같은 팩토리를 재사용한다. 같은 key면 캐시를 공유해 부모·자식이 각자 `useQuery`해도 요청은 한 번. key와 API 요청은 한 정규화 결과에서 만들어 어긋나지 않게 한다.
- **selector는 원자적·원시값.** `ids.length`·`includes(id)`는 `Object.is`를 통과해 다른 항목이 바뀌어도 리렌더되지 않는다. 새 객체·배열을 만드는 selector만 `useShallow`가 필요하다. 개수처럼 계산되는 값은 저장하지 않고 파생한다.
- **store엔 id만, 나머지는 서버 참조.** 이름·가격을 store에 복사하면 서버 데이터와 어긋난다. id만 두고 렌더는 서버 응답에서 읽는다.
- **persist는 SSR에서 `skipHydration` + 마운트 후 `rehydrate`.** 서버는 localStorage를 못 읽어, 첫 렌더를 빈 상태로 맞춰 hydration mismatch를 없앤다. 복원 전 값이 필요한 UI는 `hasHydrated`로 gate해 잘못된 초기값을 감춘다. 손상·구버전 저장값은 zod 검증 + `migrate`로 복구한다.
- **서버 프리패치(RSC) vs 다음 페이지 prefetch(클라).** 전자는 현재 페이지 초기 데이터를 HTML에 심어 SEO·첫 화면을 챙기고, 후자는 클라 캐시를 미리 데워 다음 이동을 즉시로 만든다 — 서버 렌더는 사용자의 다음 클릭을 모르므로 후자는 `useEffect`에서만 가능하다.

## 🧪 테스트

- **순서 무관하게 격리한다.** 각 테스트는 시작 상태를 스스로 세우고, 전역 싱글턴·모듈 상태에 남은 값을 물려받지 않는다. 한 테스트가 다른 테스트의 실행을 전제하면(예: 앞 테스트가 먼저 복원해두길 기대) `vitest run --sequence.shuffle`에서 깨진다 — 몇 번 돌려 순서 무관을 확인한다.
- **순서 있는 동작은 한 테스트에 몰아서.** step을 여러 테스트로 쪼개 "A가 먼저 돌아야 B가 통과"로 만들지 않는다. 시퀀스를 한 테스트가 처음부터 끝까지 수행하고 중간·최종 상태를 단언한다. 코드가 순차적이어도 테스트끼리는 격리된다.
- **새로 쓰는 테스트 이름은 조건 + 행동 + 결과·한국어 -다체.** `works`·`renders`·`should be true` 같은 영문 상투구를 새로 짓지 않는다 — 실패 리포트에서 이름만 읽고 원인이 짐작돼야 한다(예: "재고가 0이면 담기 버튼이 잠긴다"). 다만 **스타터가 준 픽스처 이름은 그대로 둔다** — 새 영문 문장을 지어내면 사람마다 갈린다. 이 규칙을 주차 문서가 아니라 여기 둬 그 갈림을 막는다.
