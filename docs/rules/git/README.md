# Git 문서

커밋과 pull request 규칙을 필요한 주제만 골라 읽기 위한 라우터입니다.

## Decision table

| 확인할 주제                                  | 문서                                   |
| -------------------------------------------- | -------------------------------------- |
| 커밋 메시지, commitlint, Git hook, 우회 금지 | [`commits.md`](commits.md)             |
| PR 본문에 남길 설계, AI 사용, 검증 정보      | [`pull-requests.md`](pull-requests.md) |

## Source of truth map

| 영역                         | Source of truth                                            |
| ---------------------------- | ---------------------------------------------------------- |
| 커밋 메시지 검증             | `commitlint.config.cjs`                                    |
| pre-commit과 commit-msg hook | `.husky/*`                                                 |
| staged 파일 처리             | `package.json`의 `lint-staged`                             |
| PR 입력 형식                 | 저장소 PR template, [`pull-requests.md`](pull-requests.md) |
