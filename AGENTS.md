## 기술 스택
- **프레임워크 / 라이브러리**: React 19
- **빌드 도구**: Vite 8
- **언어**: TypeScript
- **패키지 매니저**: pnpm
- **코드 품질 관리**: ESLint, Prettier, Husky

## 컴포넌트 작성 규칙
- Props interface는 컴포넌트 파일 최상단에 정의
- 이벤트 핸들러 네이밍: Props는 `on{Event}`, 내부 함수는 `handle{Event}`
- 조건부 렌더링은 중첩 삼항 연산자를 금지하며, `early return` 패턴을 최우선으로 적용

## 코드 리뷰 및 품질 규칙
- default export 사용 금지
- 의도가 이름에 명확히 드러나도록 네이밍할 것 (data, temp, flag, handleClick1 등 금지)
- 한 함수/컴포넌트는 한 가지 일만 하도록 작성할 것
- any, as, @ts-ignore 타입 남용 절대 금지 (TypeScript 안전성 확보)
- 파생 가능한 값은 useState + useEffect로 동기화하지 말고 직접 계산할 것
- 컴포넌트 내부에 직접 fetch를 사용하지 말고 API 레이어를 분리할 것
- 디버깅용 console.log 및 잔재 코드는 무조건 제거할 것
- 커밋 메시지는 반드시 `Conventional Commits` 타입을 준수할 것 (feat:, fix:, chore:, refactor:)