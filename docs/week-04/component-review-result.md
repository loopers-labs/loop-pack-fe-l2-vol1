# 4주차 Component Review 결과

> `/component-review` 스킬로 `src/` 전체를 대상 실행. 5개 관점(관심사 분리·Custom Hook 책임·API 레이어·분리 근거/프로세스·Server/Client 경계)을 병렬 점검. 총 2회 실행 — 1차(아래 "1차 리뷰")는 발견 15건, 2차("2차 리뷰")는 `/demo/*` 라우트 삭제 이후 재점검한 발견 9건. 둘 다 전부 반영 완료.

## 1차 리뷰

### 🟠 Major

- `[fixed]` 데모 페이지 2곳의 문서화 섹션 컴포넌트(`DialogDocSection`/`SelectDocSection`)가 타입·JSX 구조가 완전히 동일한데 각각 새로 작성됨. 공유하지 않은 이유가 코드 주석·문서 어디에도 없음. (관심사 분리 / 분리 근거·프로세스)
  → 공용 `DocSection` 컴포넌트로 통합(이후 `/demo/*` 라우트 자체가 삭제되며 이 컴포넌트도 함께 제거됨 — 2차 리뷰 참고). `.example`만 페이지별로 달라서(`dialog`는 flex 레이아웃 추가) `exampleClassName` prop으로 흡수.
- `[fixed]` `fetchApi`가 `res.ok` 체크 없이 `res.json()`을 반환하고, `error.tsx`가 하나도 없음. (API 레이어)
  → `fetchApi`에 `res.ok` 체크·throw 추가, fetch가 있는 라우트에 `error.tsx`·`loading.tsx` 신설.
- `[fixed]` `Product` 타입이 route의 mock 구조를 손으로 재선언, 단일 진실 소스 없음. (API 레이어)
  → `src/app/api/products/_types.ts`에 `Product` export, route와 페이지가 같은 타입 참조(`code-style.md`의 `_types` 컨벤션을 이 저장소에서 처음 실제 적용).

### 🟡 Minor

- `[fixed]` `src/components/ui/select/TextOptionSelect.tsx:48,79` 등 3파일 6곳 — `option.stock === 0` 하드코딩 반복. (Custom Hook)
  → `src/utils/isSoldOut.ts` 추출, 3개 컴포넌트가 참조.
- `[fixed]` `src/components/ui/select/SizeOptionSelect.tsx:70-81` 등 3파일 — toggle 아이콘 `<Image>` 마크업 반복, "마크업 완전 독립" 근거와 배치. (분리 근거/프로세스)
  → `src/components/ui/select/SelectToggleIcon.tsx`로 통합, 3개 CSS 모듈의 `.toggleIcon`/`.toggleIconOpen` 삭제.
- `[fixed]` 데모 페이지 전체가 `'use client'`. (Server/Client 경계)
  → `'use client'` 제거, 실제 상태가 필요한 조각만 `ControlledDialogDemo.tsx`·`UncontrolledDialogDemo.tsx`로 분리. (uncontrolled 쪽은 상태가 없었지만, `Dialog.Trigger` 등 `Object.assign` 서브 프로퍼티가 Server→Client "client reference" 경계를 못 넘는 걸 빌드 에러로 확인해서 같이 leaf로 분리함 — 자세한 내용은 아래 참고.)
- `[fixed]` `src/hooks/useSelect.ts:106-110` — `onClear`가 `selectIndex`와 달리 `undefined` 가드 없음. (Custom Hook)
  → `selected === undefined`면 조기 반환하도록 가드 추가.
- `[fixed]` `src/hooks/useSelect.ts:16` — 훅 이름이 키보드/바깥클릭 책임까지는 설명 못함. (Custom Hook)
  → 리네이밍 대신(3개 소비처 리스크 대비 이득 작음) 상단 주석에 책임 범위와 근거를 명시.
- `[fixed]` `src/app/api/products/route.ts:67` — `totalCount` 미사용. (API 레이어)
  → 응답에서 제거.
- `[fixed]` `getProducts`/`getSizes`/`getPurchaseOptions` 반복 패턴. (API 레이어)
  → 코드 변경은 안 함(제네릭화하면 리소스별 키 타이핑이 억지스러워짐) — 이유를 코드 주석으로 남김.

### 💡 Suggestions

- `[no_change_needed]` `src/hooks/useSelect.ts:67-75` — `useOutsideClick` 분리 검토.
  → 실제 두 번째 후보인 Dialog는 `Dialog.Overlay`로 이미 바깥 클릭을 해결하고 있어 분리 대상이 아님. `src/hooks/README.md`에 근거 문서화.
- `[fixed]` `src/components/ui/dialog/index.tsx` — Dialog가 custom hook 대신 Context를 쓰는 이유 미문서화.
  → `DialogContext` 근처에 근거 주석 추가(Select와 Dialog가 푸는 문제가 다르다는 요지), `src/hooks/README.md`로 상세 설명 연결.
- `[fixed]` `src/app/api/products/route.ts` 등 — 응답 봉투(envelope) 규칙 미문서화.
  → `src/app/api/README.md` 신설, 봉투 규칙 + `_types.ts` 컨벤션 기록.
- `[fixed]` `loading.tsx` 없음.
  → 위 API 에러 처리 항목과 함께 추가.
- `[fixed]` `src/app/page.tsx:3-24` — 인라인 style 사용.
  → `src/app/page.module.css`로 전환.

### 1차 구현 중 발견한 이슈

계획엔 없었지만 구현하다 드러난 것 — Dialog 데모 페이지를 Server Component로 바꾸면서 uncontrolled
섹션(`<Dialog><Dialog.Trigger>...`)도 그대로 직접 렌더하면 될 줄 알았으나, 빌드에서
`Element type is invalid... got undefined` 에러가 났다. `Dialog.Trigger`/`.Overlay`/`.Content`는
`Object.assign`으로 런타임에 붙인 프로퍼티라, Server Component가 `'use client'` 모듈을 "client
reference"로 받을 때는 최상위 export만 참조로 변환되고 이런 서브 프로퍼티는 따라오지 않는다. 그래서
상태가 없는 uncontrolled 데모도 `UncontrolledDialogDemo.tsx`(`'use client'`)로 분리해서, 컴파운드
서브 프로퍼티에 대한 JSX 접근이 client 모듈 그래프 안에서만 일어나도록 했다. (이 컴포넌트는 이후
`/demo/*` 라우트 삭제 때 `src/app/_components/`로 옮겨졌다 — 2차 리뷰 참고.)

## 2차 리뷰

`/demo/select`, `/demo/dialog` 라우트를 삭제하고 랜딩 페이지(`/`) 탭으로 통합한 뒤 재점검. 1차에서
고친 항목들은 전부 코드에 정확히 반영돼 있었으나(`grep -rn "eslint-disable\|@ts-ignore\|: any\b\| as any" src/` 매치 없음 포함), 그 이후 작업에서 새로 생긴 문제와, 문서·주석이 삭제된 파일을 계속
가리키고 있는 "stale 참조" 문제가 여러 건 발견됐다.

### 🟠 Major

- `[fixed]` `src/services/catalog.ts:11,25` — "소비처가 demo/select 페이지와 랜딩 페이지 프리뷰 2곳"이라는 근거 주석이 남아 있는데, `/demo/select` 라우트가 삭제되어 지금은 `SelectPreview.tsx` 한 곳뿐이다. 분리 근거가 사실과 달라 이 파일을 계속 별도로 둬도 되는지 판단하려는 사람을 오도한다. (관심사 분리 / API 레이어 / 분리 근거·프로세스 — 3개 관점에서 공통 지적)
  → 두 주석 모두 "소비처 한 곳"으로 갱신.
- `[fixed]` `src/app/api/sizes/route.ts`, `src/app/api/purchase-options/route.ts` — `src/app/api/README.md`가 못박은 컨벤션("route 응답 아이템 타입은 같은 폴더 `_types.ts`에 정의")을 `products`만 지키고 이 두 route는 안 지킨다. mock 배열이 타입 없는 리터럴이라, `catalog.ts`가 `SizeSelectOption`/`TextSelectOption`으로 가져다 쓸 때 route 응답 구조가 실제로 그 타입과 맞는지 컴파일러가 검증하지 못한다. (API 레이어)
  → 두 route의 mock 배열에 각각 `SizeSelectOption`/`TextSelectOption` 타입을 붙임. 이 타입은 이미 UI 컴포넌트가 소유하고 있어(API 응답 = UI prop 형태가 동일) 새 `_types.ts`로 중복 정의하지 않고 그대로 import — README.md의 "타입" 절에 이 갈림 기준(새 타입이면 `_types.ts`, 이미 있으면 그대로 import)을 명시.
- `[fixed]` `src/app/error.tsx` — `SelectPreview` 하나의 fetch 실패만 원인인데 라우트 루트 `error.tsx`로 처리해서, 실패 시 관련 없는 `DialogPreview`(Dialog 탭)까지 포함한 페이지 전체가 에러 화면으로 대체된다. (API 레이어 / Server·Client 경계 — 2개 관점에서 독립적으로 동일하게 지적)
  → `SelectPreviewBoundary`(class 컴포넌트 — React에 함수형 에러 바운더리가 없어 이 파일만 예외적으로 class 사용)를 신설해 `<Suspense><SelectPreview /></Suspense>`를 감싸도록 좁힘. 루트 `error.tsx`는 그 외 예기치 못한 에러를 위한 마지막 안전망으로 역할을 재정의. 실제로 `/api/products`를 500으로 바꿔 Select 탭만 에러 UI가 뜨고 Dialog 탭은 계속 동작하는 걸 확인.
- `[fixed]` `src/app/_components/ControlledDialogDemo.module.css:1-9`, `UncontrolledDialogDemo.module.css:1-9` — `.trigger` 규칙이 두 파일에 글자 그대로 중복. (분리 근거/프로세스)
  → 공용 `DialogDemoTrigger.module.css`로 통합, 두 컴포넌트가 같이 참조.
- `[fixed]` `src/services/catalog.ts:36-46` — 네트워크 호출이 없는 순수 매핑 함수 `toThumbnailOptions`가 API 호출 계층에 같이 있음. (관심사 분리)
  → `src/utils/toThumbnailOptions.ts`로 이동.
- `[fixed]` 이 문서(1차 리뷰 항목)가 이미 삭제된 `src/app/demo/_components/DocSection.tsx` 경로를 참조 — 지난 갱신에서 이미 고쳤음을 재확인.

### 🟡 Minor

- `[fixed]` `src/hooks/useSelect.ts:112-127,153-166` — 훅이 반환하는 `open`/`close`/`toggle`을 현재 3개 소비 컴포넌트 어디에서도 구조분해해 쓰지 않음(`onTriggerClick` 내부에서 `toggle`만 씀). (Custom Hook)
  → 세 값을 반환 객체에서 제거, 필요해지면 다시 반환하기로 하고 그 근거를 주석으로 남김.
- `[fixed]` `/demo/*` 라우트를 삭제하고 랜딩 탭으로 합친 상위 아키텍처 결정 근거가 코드 어디에도 없음. (분리 근거/프로세스)
  → `page.tsx`의 프리뷰 섹션 위에 "왜 별도 라우트 대신 탭으로 합쳤는지" 주석 추가.

### 💡 Suggestions

- `[fixed]` `src/hooks/useSelect.ts:37` — `selectedIndex`의 참조 동일성 비교 전제가 타입에 문서화돼 있지 않음.
  → `UseSelectParams` 위에 전제 조건 주석 추가.
- `[fixed]` `src/services/catalog.ts:17` — `cache: 'no-store'` 하드코딩, 향후 캐싱 전략이 필요해지면 참고할 지점.
  → 해당 줄에 짧은 주석 추가.

### 2차 재검토 판정 (수정 후)

| 관점               | 1차 (수정 후) | 2차 (수정 후) |
| ------------------ | ------------- | ------------- |
| 관심사 분리        | ✅            | ✅            |
| Custom Hook        | ✅            | ✅            |
| API 레이어         | ✅            | ✅            |
| 분리 근거/프로세스 | ✅            | ✅            |
| Server/Client 경계 | ✅            | ✅            |

## 왜 2차에서 지적이 많이 나왔는가

9건 중 6건(Major 4건 포함)이 "코드는 맞게 바뀌었는데 그걸 설명하는 주석·문서가 안 바뀐" 유형이었다
(`catalog.ts`의 소비처 수 주석, 이 문서 자체의 죽은 경로 참조, 탭 통합 근거 누락 등). 공통 원인은
`/demo/select`·`/demo/dialog` 라우트를 삭제하고 랜딩 페이지로 합치는 작업이 **1차 리뷰에서 이미
"분리 근거를 남겨라"라는 지적에 따라 달아둔 주석들의 전제 자체를 깨뜨렸는데**, 그 리팩터링을 하면서
"이 변경이 무효화하는 기존 주석이 있는가"를 체크하는 단계가 없었기 때문이다. 컴파일러/린터는 코드
오류는 잡아도 주석이 사실과 맞는지는 검증하지 못해서, 구조를 옮기는 작업 자체는 정상적으로
끝났어도(빌드·테스트 통과) 주석은 조용히 낡은 채로 남았다.

나머지 3건은 성격이 다르다:

- `sizes`/`purchase-options`의 `_types.ts` 누락은 **새 컨벤션의 부분 적용** — `products`에 컨벤션을
  만들 때 형제 route 두 개에 동시에 적용하지 않았다.
- `error.tsx` 스코프 문제는 **아키텍처 변경이 기존 설계를 무효화**한 경우 — `/demo/select` 하나만
  있을 땐 라우트 단위 에러 처리가 맞았지만, 그 라우트가 여러 독립된 기능(Select/Dialog 탭)을 가진
  홈페이지로 흡수되면서 같은 설계가 더는 맞지 않게 됐는데 재검토 없이 그대로 옮겨졌다.
- Dialog 데모 트리거 CSS 중복은 **기계적 분리의 부작용** — 페이지 하나의 CSS 모듈을 leaf 컴포넌트
  둘로 쪼개면서 필요한 클래스를 각자 파일에 복사했고, 겹치는지 확인하지 않았다. 같은 리뷰 라운드에서
  `SelectToggleIcon`으로 반복 마크업을 통합한 직후에 반대되는 처리를 한 셈이라 더 아이러니했다.

즉 2차 지적 대부분은 코드 품질이 나빠져서가 아니라, **큰 구조 변경(라우트 삭제+통합) 이후 "이 변경이
건드리는 다른 부분이 있는가"를 체계적으로 훑는 단계가 없었기 때문**에 나왔다. 다음에 비슷한 규모의
구조 변경을 할 때는 변경 직후 `grep`으로 삭제/이동된 경로·컴포넌트명을 남은 파일에서 찾아보는 걸
마지막 단계로 넣는 게 이런 종류의 누락을 줄이는 가장 싼 방법이다.

## 검증

`pnpm lint`, `pnpm build`(캐시 삭제 후 클린 빌드), `pnpm test:e2e`(28건) 모두 통과. `SelectPreviewBoundary`는
`/api/products`를 일시적으로 500으로 바꿔 Select 탭만 에러 UI로 전환되고 Dialog 탭은 계속 동작하는지
Playwright로 직접 확인한 뒤 원복했다.

## AI 작성 표기

이 문서는 AI(Claude)가 `/component-review` 스킬로 `src/` 전체를 5개 관점에서 병렬 서브에이전트
리뷰를 실행하고, 각 결과를 종합·중복 제거해 작성했습니다. 발견 사항의 등급 분류와 관점별 통과
여부 판정은 AI가 판단했고, 사용자가 검토합니다.

1차·2차 리뷰의 수정은 모두 AI가 직접 수행했습니다. "왜 2차에서 지적이 많이 나왔는가" 절의 원인
분석도 AI가 스스로의 작업 이력(라우트 삭제·통합 작업 시점과 각 지적 사항의 연관성)을 근거로
판단해 작성했습니다. 최종 코드와 이 분석 내용은 사용자가 검토합니다.

---

**addendum**: 위 2차 리뷰가 다루는 `src/services/catalog.ts`, `src/utils/toThumbnailOptions.ts`는
이후 별도의 "성급한 추상화 점검" 요청으로 다시 검토됐다. 둘 다 소비처가 `SelectPreview.tsx` 하나뿐인
상태가 유지되고 있어("두 번째 소비처가 생기면 분리를 고려" — 위 2차 리뷰 본문 참고), 그 두 번째
소비처가 실제로 나타나기 전까지는 소비처 페이지에 인라인하는 쪽이 낫다고 판단해 두 파일을
`SelectPreview.tsx`로 합치고 삭제했다. 이 문서의 2차 리뷰 본문(찾은 시점의 판단)은 고치지 않고
그대로 둔다.
