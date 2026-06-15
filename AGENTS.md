# 1주차 과제 규칙 가이드라인

## 🛠️ 빌드 및 검사 명령어
- 빌드: pnpm run build
- 린트: pnpm run lint

## 📐 컴포넌트 작성 규칙
- 컴포넌트 파일 하나에 하나의 export만 허용
- Props interface는 컴포넌트 파일 최상단에 정의
- 이벤트 핸들러 네이밍: Props는 `on{Event}`, 내부 함수는 `handle{Event}`
- 조건부 렌더링은 중첩 삼항 연산자를 금지하며, `early return` 패턴을 최우선으로 적용

## 🔍 코드 리뷰 및 품질 규칙
- AI가 제안한 코드는 반드시 "왜 이렇게 고쳤는가"를 설명할 수 있어야 함
- any, as, @ts-ignore 타입 남용 절대 금지 (TypeScript 안전성 확보)
- 파생 가능한 값은 useState + useEffect로 동기화하지 말고 직접 계산할 것
- 컴포넌트 내부에 직접 fetch를 사용하지 말고 API 레이어를 분리할 것
- 디버깅용 console.log 및 잔재 코드는 무조건 제거할 것
- 커밋 메시지는 반드시 `Conventional Commits` 타입을 준수할 것 (feat:, fix:, chore:, refactor:)