# 데모 페이지 개선 — Select 영역 스펙

## 목표

시작 페이지를 Select / Dialog 데모 쇼케이스로 재구성한다. 이 스펙은 Select 영역을 다룬다.

## 비범위

- Dialog 영역 개선(기본 컨텐츠 / Form / Nested) — 다음 스펙
- Downshift · Radix · BaseUI 문서 예시 추가 — 다음 스펙
- useSelect 핵심 로직(키보드·선택·open 상태) 변경

## 확정 목표

- 과제 이미지 3종(사이즈 · 썸네일 · 텍스트)과 시각적으로 일치하는 select 데모
- 메뉴는 `@floating-ui/react` popover로 렌더해 아래 컨텐츠를 밀지 않는다
- 4번째 데모: 그룹 옵션 (Radix 'grouped items' 대응) — 그룹 라벨/구분 렌더도 사용처 소유
- 5번째 데모: 액션 제어 (Downshift 'action props' 대응) — openMenu/closeMenu/selectItem 직접 호출
- 사이즈 · 텍스트 데모는 목록을 늘려 메뉴 내부 스크롤 (max-height)
- 스타터 안내 문구 제거

## 조사 결과

- 과제 완료조건 이미지 3종: `docs/assignments/week-04.md:38-44` — select1(사이즈) · select2(썸네일) · select3(텍스트)
- 과제의 popover 지침: "팝오버가 필요하면 `@floating-ui/react`를 쓴다" (`docs/assignments/week-04.md:34`)
- 기존 데모 3종 존재: `src/components/ui/select/SelectDemo.tsx` — 현재 메뉴가 인라인 펼침이라 아래 컨텐츠를 밀어냄
- `useSelect` prop getter는 사용처 핸들러는 병합하지만 ref는 병합하지 않음 (`useSelect.ts:267-300`) — floating-ui의 `refs.setReference/setFloating` 연결에 필요
- Dialog compound: controlled API · Portal · 스크롤락 · ESC/오버레이 닫기 완비 (`src/components/ui/dialog/Dialog.tsx`) — 바텀시트에 재사용 가능
- `@floating-ui/react` 미설치 (`package.json` dependencies: next/react/react-dom만)

## 결정 사항

- D1: 이미지 3종 데모 모두 popover로 — 실제 커머스처럼 메뉴가 아래 컨텐츠 위에 뜬다 (사용자 선택)
- D2: ~~바텀시트(Dialog + useSelect 조합)~~ → ~~색상 스와치 그리드~~ → **그룹 옵션 + 액션 제어 데모로 확정** — 바텀시트는 키보드 제어에 outside-click 소유권 조정 등 과제 범위 밖 확장이 필요해 취소, 스와치 그리드는 좌우 키 이동이 자연스러운 UI라 ↑↓ 리스트박스 로직과 안 맞아 취소. Downshift·Radix·Base UI 문서 예시 조사 후 훅 수정 없이 되는 두 가지로 결정 (사용자 결정)
- D6: 사이즈·텍스트 목록 확장 + popover max-height(360px) 스크롤. 키보드 하이라이트가 스크롤 영역 밖으로 나가지 않게 hook에 scrollIntoView 보정 추가 (사용자 요청)
- D3: `getToggleButtonProps` / `getMenuProps`가 사용처 ref도 병합하도록 확장 — floating-ui 연결용, 핸들러 병합과 같은 원칙
- D4: 신규 의존성 `@floating-ui/react` 추가 — 과제 문서 명시 + 사용자 지시로 승인
- D5: `page.tsx`는 [Select 영역] / [Dialog 영역] 섹션 구조로 재구성, 스타터 안내 문구 제거 (Dialog 영역은 기존 데모 유지)

## 완료 조건

- [x] 시작 페이지 Select 영역에 사이즈 · 썸네일 · 텍스트 · 그룹 · 액션 제어 5개 데모가 렌더된다
- [x] 3종 데모가 각 이미지와 시각적으로 일치한다 (헤더 문구 · 뱃지 · 색 · 구분선 · 타이포)
- [x] 3종 데모의 메뉴가 popover로 떠서 아래 컨텐츠를 밀지 않는다
- [x] 그룹 옵션: 톤별 그룹 라벨이 보이고, 키보드 이동은 라벨을 건너뛰고 옵션끼리만 탄다
- [x] 액션 제어: openMenu/closeMenu/최저가 선택/선택 비우기 버튼이 동작한다
- [x] 사이즈·텍스트 메뉴가 max-height에서 스크롤되고, 키보드 하이라이트가 스크롤을 따라간다
- [x] 스타터 안내 문구가 페이지에서 사라진다
- [x] 기존 useSelect · Dialog 테스트 통과, `pnpm build` · `pnpm lint` 통과

## 태스크

- T1: `@floating-ui/react` 설치 — fulfills: popover 렌더
- T2: prop getter ref 병합 확장 + 테스트 — fulfills: popover 연결
- T3: SelectDemo 3종을 이미지 정확 구현 + popover로 재작성 — fulfills: 이미지 일치, popover
- T4: 바텀시트 데모 (Dialog 재사용) — fulfills: 바텀시트
- T5: `page.tsx` 재구성 — fulfills: 스타터 제거, 영역 구조
