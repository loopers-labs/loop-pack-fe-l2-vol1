## 컴포넌트 작성 규칙

- Props interface는 컴포넌트 파일 최상단에 정의
- 이벤트 핸들러 네이밍: Props는 `on{Event}`, 내부 함수는 `handle{Event}`
  - 예시) `<Component onClick={handleClick} />`

## 코드 리뷰 및 품질 규칙

- default export 사용 금지
- 의도가 이름에 명확히 드러나도록 네이밍할 것 (data, temp, flag, handleClick1 등 금지)
- 한 함수/컴포넌트는 한 가지 일만 하도록 작성할 것
- 파생 가능한 값은 useState + useEffect로 동기화하지 말고 직접 계산할 것
- 컴포넌트 내부에 직접 fetch를 사용하지 말고 API 레이어를 분리할 것
- 커밋 메시지는 반드시 `Conventional Commits` 타입을 준수할 것 (feat:, fix:, chore:, refactor:)
