# Loopers Pack — Frontend L2 Vol.1

Loopers 프론트엔드 과정(TypeScript · React · Next.js)의 과제 제출 & 피드백 레포입니다.
4주차부터 이 레포가 **커머스 프로젝트(Next.js)** 본체가 됩니다.

## 시작하기

```bash
pnpm install
pnpm dev
```

> Next.js(App Router) + React 19 + TypeScript. 1~3주차 React+Vite 산출물은 개인 브랜치 히스토리에 남아 있습니다.

## 구조

```txt
src/
  app/                           # Next App Router entry
    _components/
      dialog-demos/              # Dialog demo components and tokenized styles
      DialogDemos.client.tsx
      select-demos/              # Select demo options, renderers, styles
      SelectDemos.client.tsx
    favicon.ico
    globals.css
    layout.tsx
    page.tsx
  shared/
    ui/
      select/                    # Select (Headless) — 4주차 1단계
        components/
        lib/
        types/
      dialog/                    # Dialog (Compound) — 4주차 2단계
docs/assignments/                # 주차별 과제 명세
```

> Next entry와 Select/Dialog 예시는 `src/app`에, 재사용 가능한 UI 구현은 `src/shared/ui`에 둡니다.

## 주차별 과제

- [1주차 — 코드 리뷰 & AI 협업 환경 구축](docs/assignments/week-01.md)
- [3주차 — 관심사 분리 & Custom Hook](docs/assignments/week-03.md)
- [4주차 — Next.js 커머스 프로젝트 골격](docs/assignments/week-04.md)
- 새 과제가 올라오면 **본인 포크의 `main`을 이 레포(upstream)와 동기화**해 받으세요.
  - GitHub: 포크 레포의 **Sync fork** 버튼
  - CLI: `git fetch upstream && git switch main && git merge upstream/main`

## 코드 품질 하네스

이 프로젝트는 AI가 생성한 코드도 동일한 기준으로 검증하기 위해 ESLint,
Prettier, Husky, lint-staged를 사용합니다.

### ESLint

ESLint는 포맷보다 코드 품질과 버그 가능성 검출에 집중합니다.

주요 설정은 다음과 같습니다.

- Next.js flat config(`core-web-vitals`, `typescript`)를 기본 baseline으로 사용합니다.
- TypeScript strict type-aware rules로 타입 회피와 불명확한 코드를 줄입니다.
- React Hooks / React Compiler lint rules로 Hook 호출 순서, dependency 누락, 렌더 중 state 변경, effect 내 동기 state 변경을 감지합니다.
- React JSX rules로 JSX 보안 및 React 작성 관습을 점검합니다.
- jsx-a11y로 접근성 문제를 정적으로 점검합니다.
- unused-imports / simple-import-sort로 사용하지 않는 import를 제거하고 import 순서를 일관되게 유지합니다.
- Next 라우트 파일(`src/app/**/{page,layout,loading,error,not-found}.tsx`)은 프레임워크 계약상 default export를 허용합니다.

### Prettier

Prettier는 코드 포맷팅만 담당합니다. ESLint와 포맷 책임이 겹치지 않도록
`eslint-config-prettier`를 사용합니다.

### Git Hook

커밋 전 `lint-staged`를 실행합니다.

- 변경된 TS/TSX 파일: ESLint 자동 수정 후 Prettier 적용
- 변경된 JS/JSON/CSS/MD 파일: Prettier 적용

검사를 통과하지 못하면 커밋되지 않습니다.

### Scripts

```bash
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:check
pnpm typecheck
pnpm build
```

- `pnpm lint`: 전체 소스 ESLint 검사
- `pnpm lint:fix`: 자동 수정 가능한 ESLint 문제 수정
- `pnpm format`: Prettier로 포맷 적용
- `pnpm format:check`: 포맷 위반 여부 확인
- `pnpm typecheck`: Next 단일 TypeScript 프로젝트 타입 검사
- `pnpm build`: Next production 빌드

## 제출

1. 이 레포를 **포크**한다.
2. 포크에서 주차 작업 브랜치를 만든다 (예: `feat/week-04`).
3. 과제를 진행하고 커밋·푸시한다 (본인 포크에).
4. **메인 레포로 PR**을 연다. PR 템플릿(이번 주 학습 / 피드백 받고 싶은 부분)을 채운다.
5. 모든 PR이 한곳에 모이므로 서로 리뷰하고, 코치 피드백 + 다음 세션 구두 방어로 이어진다.

> PR은 **메인 레포(upstream)로** 올립니다 — 모두의 PR이 한곳에 모여 서로 리뷰할 수 있습니다. (협력자 추가는 필요 없습니다.)

## 4주차 과제 기록

이번 주에는 브라우저가 제공하는 네이티브 `<select>` 동작을 빌리지 않고, 옵션 객체와 상태 전이를 직접 관리하는 Headless Select를 구현했습니다. 같은 상태 로직으로 텍스트, 사이즈, 상품형 옵션을 렌더하고, 표시 방식은 사용처의 render function이 결정하도록 분리했습니다.

### Select 구조와 책임

| 구성 요소                              | 책임                                                                              | 설계 근거                                                                     |
| -------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `SelectRoot` / `useSelect`             | 열림, 선택값, highlight와 선택 상태 전이를 관리                                   | 모든 사용처가 동일한 상태 전이 규칙을 공유하도록 로직을 한곳에 모았습니다.    |
| `SelectTrigger`                        | click과 키보드 입력을 상태 전이로 연결                                            | 옵션 UI와 입력 처리 규칙을 분리하고 consumer event를 먼저 실행합니다.         |
| `SelectContent`                        | listbox DOM, Native Popover, React 상태 동기화와 inline fallback을 관리           | 위치와 top layer 처리는 선택 로직과 무관한 presentation infrastructure입니다. |
| `SelectItem`                           | `selected` / `highlighted` / `disabled` 상태를 render function과 data 속성에 노출 | 사용처가 상태에 따라 자유롭게 생김새를 결정할 수 있게 했습니다.               |
| `OptionNavigation` / `TriggerKeyboard` | 활성 옵션 탐색과 Arrow/Home/End/Enter/Space/Escape/Tab 처리                       | DOM 렌더링과 무관한 탐색 규칙을 독립적으로 읽고 검토할 수 있게 했습니다.      |

### 옵션 객체를 value로 사용한 이유

`SelectRoot<TOption>`은 `value`와 `onChange`에서 옵션 객체 전체를 주고받습니다. 문자열 id만 반환하면 사용처가 가격, 배송 정보, 사이즈 설명을 다시 조회해야 하지만, 객체를 반환하면 선택 직후 필요한 데이터를 그대로 사용할 수 있습니다. 공통 로직은 `id`, `label`, `disabled`만 알고, 각 사용처는 자신의 추가 필드를 유지합니다.

### 비활성 옵션 처리

- `OptionNavigation`은 활성 옵션만 대상으로 다음 항목을 계산해 품절 옵션을 건너뜁니다.
- pointer highlight와 click selection에서도 `disabled`를 다시 확인합니다.
- 모든 옵션이 비활성인 경우에는 highlight 없이 열리며 Enter를 눌러도 선택이 발생하지 않습니다.

### Native Popover와 Anchor Positioning을 선택한 이유

Base UI처럼 옵션 목록이 주변 레이아웃을 밀지 않고 trigger를 기준으로 떠야 한다고 판단했습니다. 다만 이번 과제에서 직접 설계해야 하는 부분은 선택 상태와 키보드 탐색이므로, popup infrastructure에는 브라우저 표준 기능을 사용했습니다.

- `popover="auto"`: top layer 렌더링, 바깥 클릭과 Escape dismiss를 브라우저에 맡깁니다.
- CSS Anchor Positioning: `position-area`, `anchor-size()`, `position-try-fallbacks`로 trigger 아래 배치, 동일 너비와 위쪽 flip을 처리합니다.
- `toggle` 이벤트: 브라우저가 닫은 상태를 React의 `open` 상태로 되돌립니다.
- `useLayoutEffect`: React에서 요청한 상태와 실제 `:popover-open` 상태가 다를 때만 `showPopover()`/`hidePopover()`를 호출합니다.
- Progressive enhancement: Popover 또는 필요한 Anchor Positioning을 지원하지 않으면 기존 inline listbox로 동작합니다.

직접 좌표를 계산하거나 scroll/resize listener를 두지 않았고, `@floating-ui/react`도 추가하지 않았습니다. 추후 임의 clipping boundary, 정교한 shift/size 계산, 중첩 popup처럼 브라우저 기본 기능을 넘어서는 요구가 생기면 현재 popup infrastructure와 `SelectContent`의 positioning layer를 다른 구현으로 교체할 수 있습니다.

### 접근성 상태

- Trigger는 `combobox`, Content는 `listbox`, Item은 `option` 역할을 사용합니다.
- Trigger에 `aria-controls`, `aria-expanded`, `aria-haspopup`를 연결했습니다.
- 열려 있는 동안에만 `aria-activedescendant`를 노출하고, 닫을 때 highlight를 초기화해 제거된 option id를 가리키지 않게 했습니다.
- focus는 Trigger에 유지하고 실제 option focus 이동 대신 `aria-activedescendant`로 현재 항목을 알립니다.

### 렌더링 예시

- 텍스트 옵션: 설명과 tone을 표시합니다.
- 사이즈 옵션: fit과 size guide를 표시합니다.
- 상품형 옵션: thumbnail, 가격과 배송 상태를 표시합니다.

세 예시는 같은 Select 상태 로직을 사용하지만 `SelectItem`의 render state를 받아 서로 다른 UI를 그립니다.

### Dialog Compound API와 상태 소유권

`Dialog`는 callable root에 `Trigger`, `Overlay`, `Content`, `Title`, `Description`, `Close`를 조합하는 Compound API입니다. 사용처는 `@/shared/ui/dialog`에서 `Dialog` 하나만 import하고 필요한 part를 같은 상태 계약 위에서 배치합니다.

- 비제어 모드는 `defaultOpen`을 초기값으로 사용하고 Dialog 내부가 열린 상태를 관리합니다.
- 제어 모드는 own `open` key의 존재로 판별하며, 상태를 직접 바꾸지 않고 `onOpenChange`로 변경을 요청합니다.
- Trigger, Close, Overlay는 consumer click handler를 먼저 실행하고 `preventDefault()`된 요청은 내부 상태 전이로 이어가지 않습니다.
- public `DialogHandle`은 `open()`, `close()`, `toggle()`만 노출하며, ref 호출도 같은 상태 변경 요청 경로를 사용해 제어 모드의 부모 소유권을 유지합니다.

### Portal, 닫기 요청과 scroll lock

Overlay와 Content는 서로 독립된 portal로 `document.body` 아래에 렌더링합니다. 서버 렌더와 초기 hydration에서는 portal을 만들지 않아 브라우저 전역 접근을 피합니다. Escape는 가장 위에 열린 Dialog만 닫고, 실제 Overlay button을 누른 경우에만 해당 레이어가 닫기를 요청합니다.

열린 Dialog는 `document.body.style.overflow`의 기존 inline 값을 보존한 뒤 `hidden`으로 바꿉니다. 중첩된 Dialog는 문서별 reference count를 공유하므로 자식만 닫힐 때는 잠금을 유지하고, 마지막 Dialog가 닫힐 때만 정확한 이전 값을 복원합니다.

### Dialog 접근성 범위

Trigger, Close, Overlay는 native button과 visible focus style을 사용하고 Overlay에는 한국어 sr-only 닫기 문구를 제공합니다. 이번 과제 범위에는 자동 focus 이동, focus trap/복원, `role="dialog"`, `aria-modal`, `aria-labelledby`, `aria-describedby`를 포함하지 않았습니다. 실제 서비스 적용 전에는 별도의 승인된 접근성 확장이 필요합니다.

### 검증

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- Chromium에서 click, 바깥 클릭, Escape, Tab, Arrow/Home/End, Enter/Space와 disabled skip을 확인했습니다.
- 375px, 768px, 1280px viewport에서 trigger 너비 일치, 8px 간격, viewport 하단의 위쪽 flip과 레이아웃 비이동을 확인했습니다.
- Anchor Positioning 지원을 강제로 끈 환경에서 inline fallback을 확인했습니다.
- 개발/프로덕션 Chromium에서 Dialog의 비제어·제어 흐름, body portal, Escape, Overlay/Close 동작과 정확한 overflow 복원을 확인했습니다.
- Dialog가 열린 375x812, 768x1024, 1280x800 viewport에서 Content와 Close가 화면 안에 있고 가로 overflow가 없는지 확인했습니다.

### 남은 작업

- 별도 test runner가 없어 현재 상호작용 검증은 브라우저 QA에 의존합니다.

### AI 활용

- Native Popover와 React 상태 동기화 방식, Anchor Positioning 적용 범위와 Base UI 비교에 AI 도움을 받았습니다.
- 최종 코드는 직접 검토하며 disabled 탐색, browser/React open 상태 동기화, 닫힌 popover 표시 여부, ARIA lifecycle, supported/fallback 경로와 품질 게이트를 확인했습니다.
