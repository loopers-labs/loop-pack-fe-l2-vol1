# FSD Boundary Review Rules

## Rule Sources

- `docs/assignments/week-06.md`
- `docs/rfc/week06-fsd.md`

## Review Goal

결정적 하네스가 보지 못하는 FSD 구조 판단을 확인한다. 주로 slice 배치, Public API 의도, `shared` 오염을 본다.

## Rules

- import 방향과 같은 레이어 다른 slice 직접 import는 `pnpm architecture:check`가 검증한다.
- AI 리뷰에서 import 경계 위반을 발견하면 코드 취향 문제가 아니라 아키텍처 하네스의 누락 또는 실패로 다룬다.
- 외부에서 slice 내부 구현 파일을 깊게 import했다면 Public API 계약을 우회한 것인지 확인한다.
- slice 밖에 공개하기로 한 값만 Public API로 노출한다.
- `export *`를 습관처럼 쌓은 barrel file은 Public API가 아니다.
- 상품 표현과 장바구니·위시리스트 행위의 조합 위치가 `widgets`나 `_pages`인지 본다.
- `shared`에는 특정 화면 문구, 비즈니스 정책, 상품·장바구니 전용 로직을 숨기지 않는다.
- `src/app`은 Next.js 라우팅 디렉터리다. 화면 로직은 얇게 조합하고, 필요하면 `_pages`에 위임한다.
- 필요한 레이어와 세그먼트만 만든다. 빈 폴더, 미사용 `index.ts`, 파일 종류만 반복하는 `utils` 창고는 만들지 않는다.
- 폴더를 옮긴다는 이유로 서버·URL·클라이언트 상태의 원본을 바꾸지 않는다.

## Findings To Prefer

- slice 외부 코드가 `slice/model/...`, `slice/ui/...`, `slice/api/...` 내부 파일을 직접 import해 Public API를 우회한 경우
- Public API가 실제 외부 계약보다 넓어서 내부 구현을 과하게 노출하는 경우
- `_pages/*` 밖에서 Next route 파일에 의존해 라우팅 경계가 흐려진 경우
- `shared/lib`에 도메인 정책이나 특정 화면 전용 로직이 들어간 경우
- Public API 의도 없이 `index.ts`에서 내부 파일을 모두 재수출하는 경우
- FSD 이동과 함께 상태 원본이 바뀌거나 서버 응답 복사가 생긴 경우

## Do Not Flag

- 한 화면에서만 쓰는 로직을 feature로 올리지 않은 경우
- Public API를 만들지 않고 상대 경로로 같은 slice 내부 파일을 쓰는 경우
- Route Handler와 mock fixture를 `src/app/api`에 남겨 둔 경우
- 사용하지 않는 레이어를 만들지 않은 경우

## Review Output

문제를 지적할 때는 `architecture:check`가 잡을 수 있는 import 위반인지, AI/사람이 판단해야 하는 구조 문제인지 먼저 구분한다. 수정안은 파일 이동보다 공개 계약과 조합 위치를 바로잡는 가장 작은 변경이어야 한다.
