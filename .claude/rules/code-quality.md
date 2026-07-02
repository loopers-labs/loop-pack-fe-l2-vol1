# 코드 품질 원칙

언어 무관 코딩 원칙. 항상 적용된다.

- **의도가 이름에 드러난다** — `data` / `temp` / `flag` 같은 의미 없는 이름 금지. 이름만 보고 무엇인지 알아야 한다.
- **한 함수/컴포넌트는 한 가지 일을 한다** — 책임이 둘 이상이면 쪼갠다.
- **타입이 코드를 설명한다** — `any` 로 회피하지 않는다(절대 금지). 타입을 좁히지 못하겠으면 데이터 구조를 다시 본다.
- **에러는 명시적으로 처리한다** — `catch (e) {}` 같이 삼키지 않는다. 로깅·재던지기·사용자 알림 중 하나는 한다.
- **기존 코드를 재사용한다** — 비슷한 유틸을 매번 새로 만들지 않는다. 새 유틸 추가 전에 검색 먼저.
- **Boy Scout Rule** — 코드를 떠날 때 들어왔을 때보다 깔끔하게 둔다. 만지는 파일 안에 작은 정리 거리(애매한 이름, 데드 코드, 묵은 주석)가 보이면 같이 정리한다. 단, 무관한 대규모 리팩터까지 끌어들이지 말 것 — 같은 PR/커밋의 맥락 안에서만.

## 주석 — 코드가 답 못하는 "왜"만 적는다

주석은 코드를 읽으면 바로 아는 **"무엇"** 을 재진술하지 않는다. 코드가 스스로 말하지 못하는 **"왜"**(의도·배경·함정)만 적는다. 이름이 충분히 설명하는 함수·변수에는 주석이 0개인 게 정답일 수 있다.

- "무엇"을 반복하는 주석 금지 — 코드가 그대로 말하는 내용을 한 번 더 쓰지 않는다.

```ts
// 페이지가 바뀌면 스크롤을 맨 위로 (브라우저 DOM 동기화)   ❌  코드가 그대로 말함
window.scrollTo(0, 0)

// 늦게 도착한 stale 응답이 최신 상태를 덮어쓰는 것 방지     ✅  코드만 봐선 모르는 '왜'
if (ignore) return
```

## 순수 함수·타입은 제자리에 둔다

- **순수 변환 함수(파싱·포맷·계산)는 컴포넌트 안에 두지 않는다.** 단 한 곳에서만 쓰여도 `utils/` 로 뺀다 — 테스트 가능해지고 컴포넌트는 표현에만 집중한다.
- **타입 정의(`type` / `interface`)는 `types/` 에 둔다.** 순수 함수 모듈(`utils`) 안에서 타입을 정의·export 하지 않는다.

## 네이밍 (의도가 이름에 드러난다)

이름만 보고 무엇인지/무엇을 하는지 알 수 있어야 한다. (컴포넌트·이벤트 핸들러 네이밍은 `react.md` 참조)

### 함수 네이밍

동사 + 목적어 — "이 함수가 뭘 하는지" 바로 알 수 있어야 한다.

```ts
formatPrice(45000)        ✅  // "가격을 포맷하는구나"
getFilteredProducts()     ✅  // "필터된 상품을 가져오는구나"
doStuff()                 ❌  // "뭘 하는데?"
process()                 ❌  // "뭘 처리하는데?"
```

### boolean 네이밍

`is` / `has` / `should` / `can` 등 접두사로 참/거짓임이 드러나게. 이중 부정 금지.

```ts
isLoading          ✅  // is + 형용사
hasError           ✅  // has + 명사
shouldRefetch      ✅  // should + 동사
canSubmit          ✅  // can + 동사

loading            △  // 관례상 허용 (useState 이름으로 흔함)
notDisabled        ❌  // 이중 부정 — if (!notDisabled) → ???
```

### 반복 조건식은 명명 boolean 으로 추출

같은 조건식이 여러번 등장하면 의도가 드러나는 boolean 으로 한 번만 계산해 재사용한다 (DRY + 의도 노출).

```ts
// ❌ page === 1 / page === totalPages 를 곳곳에서 반복
<button disabled={page === 1}>이전</button>
<button disabled={page === totalPages}>다음</button>

// ✅ 의도를 이름에 담아 한 번만 계산
const isFirstPage = page === 1
const isLastPage = page === totalPages
<button disabled={isFirstPage}>이전</button>
<button disabled={isLastPage}>다음</button>
```

### 상수 네이밍

재할당 없는 상수는 `UPPER_SNAKE_CASE`.

```ts
const MAX_RETRY_COUNT = 3          ✅  // UPPER_SNAKE_CASE
const ITEMS_PER_PAGE = 20          ✅
const defaultPageSize = 20         ❌  // 상수인데 camelCase
```
