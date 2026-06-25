# !/usr/bin/env bash
# PreToolUse(Bash) 게이트 우회 차단 hook.
# 책임: Bash 명령 문자열에서 git hook / husky 우회 플래그만 검사한다.
#   - 코드 내용(as·eslint-disable·@ts-ignore)은 ESLint(P0)가 SSOT이므로 여기서 검사하지 않는다.
# 기본 동작은 allow(exit 0). 우회 패턴 매치 시에만 deny.
# set -e 금지: jq 실패/미설치가 전체 차단으로 번지면 안 된다(빈 명령 → 매치 없음 → allow).

input="$(cat)"

# jq 미설치/파싱 실패 시 command는 빈 문자열 → 어떤 패턴에도 매치되지 않아 allow로 떨어진다.
command="$(printf '%s' "$input" | jq -r '.tool_input.command // ""' 2>/dev/null)"

# --no-verify(git hook 우회) / HUSKY=0 / HUSKY_SKIP_HOOKS(husky 우회)만 검사.
# -n 같은 단독 플래그는 검사하지 않는다(echo -n / grep -n 등 대량 오탐 방지).
if printf '%s' "$command" | grep -Eq -- '--no-verify|HUSKY=0|HUSKY_SKIP_HOOKS'; then
  printf '%s' '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"게이트 우회(--no-verify / HUSKY=0 / HUSKY_SKIP_HOOKS)는 금지됩니다. git hook을 건너뛰지 말고 코드를 고쳐 게이트를 통과하세요."}}'
  exit 0
fi

exit 0