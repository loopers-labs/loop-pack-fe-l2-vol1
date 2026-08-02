---
name: architecture-review
description:
  프로젝트의 폴더 구조와 모듈 간 의존 관계를 분석한다.
  FSD 레이어 규칙 준수 여부, 순환 의존, 응집도/결합도를 점검하고
  구조적 리스크를 드러낸다.
  코드 수정안을 제시하지 않으며, 구조적 판단만 제공한다.
  구조를 리뷰·감사·점검·진단하라는 요청, import 방향/레이어 경계/의존 위반을
  확인하라는 요청에 사용한다.
---

# Architecture Review

폴더 구조를 FSD 레이어로 매핑하고, 레이어 경계 위반과 구조적 리스크를 드러낸다.
**결과물은 구조적 판단이지 코드 수정안이 아니다.** diff·패치·"이 파일을 이렇게
바꾸세요"를 내지 않는다. "지금 어디가 어떻게 위험한가"만 판단한다.

## 우선순위 (겹치는 스킬과의 관계)

레이어 정의·import 규칙·public API 규약 같은 **규칙의 근거**는
`feature-sliced-design` 스킬을 참조한다 — 여기서 규칙 전문을 다시 베끼지 않는다.

단, **리뷰·감사 작업일 때는 이 스킬이 우선한다.** `feature-sliced-design` 은
"코드를 어디에 둘지 결정하고 배치하라"는 생성·배치 지향이지만, 리뷰 요청에서는
그 모드로 넘어가지 않는다. 규칙 판정 기준만 그 스킬에서 가져오고, **판단만
제공하고 수정은 하지 않는다**는 이 스킬의 자세를 따른다. 두 스킬이 충돌하면
이 스킬을 따른다.

## 분석 순서

1. **레이어 매핑** — 현재 폴더 구조를 FSD 레이어(`app`/`pages`/`widgets`/
   `features`/`entities`/`shared`)로 매핑한다. 어느 레이어에도 깔끔히 안 들어가는
   폴더는 그 자체가 리스크 신호다. Next.js App Router 프로젝트라면 아래
   [Next.js App Router 명명 규칙](#nextjs-app-router-명명-규칙) 을 먼저 적용해
   `src/app` 을 FSD App 레이어로 오인하지 않는다.
2. **import 방향** — 상위→하위(`app → pages → widgets → features → entities →
   shared`)만 허용된다. 하위가 상위를 import 하는 역방향 위반을 찾는다.
   (예: `entities` 가 `features` 를 import → 위반)
3. **feature 간 직접 의존** — 같은 레이어 슬라이스끼리의 cross-import를 찾는다.
   특히 `features/A` 가 `features/B` 를 직접 import 하는 경우.
4. **entities 의 상위 레이어 침범** — `entities` 가 `features`/`widgets`/`pages`
   등 자신보다 위 레이어의 개념·코드를 참조하거나 끌어다 쓰는지 확인한다.
5. **shared 의 비즈니스 로직 포함** — `shared` 는 인프라(UI 킷·유틸·API 클라이언트·
   라우트 상수)만 담아야 한다. 도메인 계산·비즈니스 규칙·워크플로가 섞여 있는지
   확인한다. (예: `shared/lib/calculateUserReputation.ts` → 침범)
6. **리스크 분류·제시** — 발견을 아래 세 축으로 분류해 제시한다.
   - **현재 문제** — 지금 당장 규칙을 어기고 있거나 결합이 깨진 곳
   - **확장 시 문제** — 지금은 괜찮지만 기능이 늘면 터질 구조
   - **대안** — 구조적 방향 제시(어느 레이어로 갈라야 하는지 등). 코드 패치가
     아니라 방향이다.

## Next.js App Router 명명 규칙

`src/app` 은 **Next.js 라우팅 디렉터리**다. FSD App 레이어와 이름은 같아도 역할이
다르다 — 매핑할 때 둘을 섞으면 안 된다.

- `src/app/**` 의 `page.tsx`·`layout.tsx`·`loading.tsx`·`error.tsx` 는 **얇은
  라우팅·조합 진입점**이어야 한다. 필요하면 `_pages` 슬라이스의 페이지 컴포넌트를
  가져와 렌더링한다. 여기에 도메인 로직·상태·데이터 페칭이 두껍게 들어있으면 리스크로
  잡는다.
- FSD App/Pages 레이어가 필요하면 예약 디렉터리와 구분되도록 `src/_app`·`src/_pages`
  를 쓴다. **`src/pages` 가 존재하면 위반으로 잡는다** — Pages Router로 오인된다.
- `src/app/api` 의 Route Handler·mock fixture 는 전환 범위에서 제외해도 된다.
  이동한다면 프론트엔드와 mock 백엔드의 경계가 RFC에 설명돼 있는지 확인한다.

## 출력 형식

- 레이어 매핑 결과를 먼저 표로 보여준다 (폴더 → 추정 레이어 → 판정).
- 이어서 위반·리스크를 `현재 문제 / 확장 시 문제 / 대안` 으로 묶어 제시한다.
- 각 항목은 **어느 파일/폴더가 어떤 규칙을 왜 어기는지**를 근거와 함께 적는다.
- 코드 수정 diff는 내지 않는다. 필요하면 "어느 방향으로 갈라야 하는지"까지만.

## 참고

- 레이어·import·cross-import·public API 규칙의 정의와 상세 판정 기준:
  `feature-sliced-design` 스킬(및 그 `references/`)을 참조한다.
