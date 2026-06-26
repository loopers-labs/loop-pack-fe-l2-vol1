# CLAUDE.md

이 파일은 이 레포에서 Claude Code (claude.ai/code) 가 코드를 다룰 때 따라야 할 지침이다.

세부 코딩 규칙은 `.claude/rules/` 로 분리돼 있다 — `code-quality.md`(항상 로드), `react.md`(`.ts/.tsx` 작업 시 로드).

## 절대 금지 (비협상)

이 규칙들은 어떤 형태로도 어겨서는 안 된다.

- **git hook 스킵 절대 금지**: `--no-verify` / `--no-gpg-sign` 류 플래그, `HUSKY=0` 같은 환경변수, husky 파일 직접 비우기 등 **어떤 방법으로도** `pre-commit`/`pre-push` 를 우회하지 않는다. 훅이 실패하면 코드를 고친다 — 훅을 끄지 않는다.


## 언어

문서·PR·커밋 메시지·응답 기본 언어는 **한국어**. 사용자가 명시적으로 영어를 요청하지 않는 한 한국어로 작성·응답.

