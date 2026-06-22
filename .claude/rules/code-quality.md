# 코드 품질 원칙

언어 무관 코딩 원칙. 항상 적용된다.

- **의도가 이름에 드러난다** — `data` / `temp` / `flag` 같은 의미 없는 이름 금지. 이름만 보고 무엇인지 알아야 한다.
- **한 함수/컴포넌트는 한 가지 일을 한다** — 책임이 둘 이상이면 쪼갠다.
- **타입이 코드를 설명한다** — `any` 로 회피하지 않는다(절대 금지). 타입을 좁히지 못하겠으면 데이터 구조를 다시 본다.
- **에러는 명시적으로 처리한다** — `catch (e) {}` 같이 삼키지 않는다. 로깅·재던지기·사용자 알림 중 하나는 한다.
- **기존 코드를 재사용한다** — 비슷한 유틸을 매번 새로 만들지 않는다. 새 유틸 추가 전에 검색 먼저.
- **Boy Scout Rule** — 코드를 떠날 때 들어왔을 때보다 깔끔하게 둔다. 만지는 파일 안에 작은 정리 거리(애매한 이름, 데드 코드, 묵은 주석)가 보이면 같이 정리한다. 단, 무관한 대규모 리팩터까지 끌어들이지 말 것 — 같은 PR/커밋의 맥락 안에서만.

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

### 상수 네이밍

재할당 없는 상수는 `UPPER_SNAKE_CASE`.

```ts
const MAX_RETRY_COUNT = 3          ✅  // UPPER_SNAKE_CASE
const ITEMS_PER_PAGE = 20          ✅
const defaultPageSize = 20         ❌  // 상수인데 camelCase
```
