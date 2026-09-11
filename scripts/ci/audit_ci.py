#!/usr/bin/env python3
"""CI 구성 자체를 검사한다.

이 저장소에서 실제로 겪은 실수만 규칙으로 올린다. 세 가지였다.

1. `deployment-smoke.yml`이 배포 SHA를 checkout했다. `deployment_status`는 base 저장소
   권한과 secrets를 들고 도는 트리거라, fork PR preview의 코드가 bypass secret이 있는
   job에서 실행될 수 있었다. 되돌려도 막을 것이 없었다.
2. `Dockerfile`이 `ARG APP_ORIGIN=http://127.0.0.1:3000`으로 기본값을 채웠다.
   `appOrigin.ts`가 기본값을 금지한 자리인데 build 게이트가 그 값으로 통과했다.
3. workflow 스텝 목록과 `pnpm check`가 따로 있어 새 게이트를 양쪽에 손으로 넣었다.
   드리프트가 예정돼 있었다.

YAML 파서를 쓰지 않는다. 의존성을 늘리지 않으려고 필요한 키만 줄 단위로 읽는다.
그래서 들여쓰기를 크게 바꾸면 이 검사가 눈이 먼다. 검사 대상이 workflow 두 개뿐이라
그 교환을 받아들인다. workflow가 늘면 파서를 넣는다.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

WORKFLOW_DIR = Path(".github/workflows")
DOCKERFILE = Path("Dockerfile")
PACKAGE_JSON = Path("package.json")

# 트리거 자체가 base 저장소 권한과 secrets를 들고 돈다.
PRIVILEGED_TRIGGERS = (
    "pull_request_target",
    "deployment_status",
    "workflow_run",
    "issue_comment",
)

# 권한 있는 트리거에서 이 식으로 checkout하면 신뢰할 수 없는 코드를 실행한다.
UNTRUSTED_REFS = (
    "github.event.deployment.sha",
    "github.event.workflow_run.head_sha",
    "github.event.pull_request.head.sha",
    "github.event.pull_request.head.ref",
)

# workflow에만 있어도 되는 명령과 그 이유.
WORKFLOW_ONLY = {
    "install": "의존성 설치는 검증이 아니다",
    "exec": "Playwright 설치는 검증이 아니다",
}

# `pnpm check`에만 있어도 되는 명령과 그 이유.
CHECK_ONLY: dict[str, str] = {}

# 일치 검사 대상은 PR 게이트 workflow 하나다. 배포 smoke는 배포 URL이 있어야 돌아서
# 로컬 `pnpm check`에 넣을 수 없다. 검사 범위를 좁히는 대신 그 이유를 여기 남긴다.
GATE_WORKFLOW = WORKFLOW_DIR / "quality.yml"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def audit_workflow(path: Path) -> list[str]:
    text = read(path)
    lines = text.splitlines()
    problems: list[str] = []

    if not re.search(r"^permissions:", text, re.M):
        problems.append(f"{path}: 최상위 permissions가 없다")
    elif not re.search(r"^permissions:\s*\n\s+contents:\s*read\s*$", text, re.M):
        problems.append(f"{path}: 최상위 permissions를 contents: read로 좁힌다")

    # 트리거 키만 본다. 주석에서 이 트리거를 왜 피하는지 설명하는 것은 위반이 아니다.
    if re.search(r"^\s{2}pull_request_target:", text, re.M):
        problems.append(f"{path}: pull_request_target을 쓰지 않는다")

    privileged = [
        trigger
        for trigger in PRIVILEGED_TRIGGERS
        if re.search(rf"^\s{{2}}{trigger}:", text, re.M)
    ]

    if privileged:
        for ref in UNTRUSTED_REFS:
            if re.search(rf"ref:.*{re.escape(ref)}", text):
                problems.append(
                    f"{path}: 권한 있는 트리거({', '.join(privileged)})에서 "
                    f"{ref}를 checkout하지 않는다"
                )

    if "secrets." in text and re.search(r"^\s{2}pull_request:", text, re.M):
        problems.append(f"{path}: pull_request 트리거에서 secrets를 쓰지 않는다")

    for number, line in enumerate(lines, start=1):
        match = re.search(r"uses:\s*([^\s#]+)", line)
        if match and "@" in match.group(1):
            ref = match.group(1).split("@", 1)[1]
            if not re.fullmatch(r"[0-9a-f]{40}", ref):
                problems.append(
                    f"{path}:{number}: action을 commit SHA로 핀한다 (현재 @{ref})"
                )

    # job마다 runs-on이 하나씩이므로 그 개수를 job 수로 쓴다.
    runs_on = len(re.findall(r"^\s+runs-on:", text, re.M))
    timeouts = len(re.findall(r"^\s+timeout-minutes:", text, re.M))
    if runs_on > timeouts:
        problems.append(
            f"{path}: job {runs_on}개 중 {timeouts}개만 timeout-minutes가 있다"
        )

    return problems


def audit_dockerfile(path: Path, required_names: list[str]) -> list[str]:
    if not path.exists():
        return []

    problems: list[str] = []
    for number, line in enumerate(read(path).splitlines(), start=1):
        match = re.match(r"\s*ARG\s+([A-Z_][A-Z0-9_]*)\s*=", line)
        if match and match.group(1) in required_names:
            problems.append(
                f"{path}:{number}: 필수 환경 변수 {match.group(1)}에 build 기본값을 두지 않는다."
                " 기본값이 있으면 env:check가 그 값으로 통과한다"
            )
    return problems


def pnpm_scripts_in_gate_workflow() -> set[str]:
    return set(re.findall(r"run:\s*pnpm\s+([A-Za-z0-9:_-]+)", read(GATE_WORKFLOW)))


def pnpm_scripts_in_check(check: str) -> set[str]:
    return set(re.findall(r"pnpm\s+([A-Za-z0-9:_-]+)", check))


def diff_commands(in_workflow: set[str], in_check: set[str]) -> list[str]:
    problems: list[str] = []
    for name in sorted(in_workflow - in_check):
        problems.append(
            f"package.json: quality.yml이 실행하는 `pnpm {name}`이 check 스크립트에 없다"
        )
    for name in sorted(in_check - in_workflow):
        problems.append(
            f"{GATE_WORKFLOW}: check 스크립트의 `pnpm {name}`을 CI가 실행하지 않는다"
        )
    return problems


def audit_drift() -> list[str]:
    check = json.loads(read(PACKAGE_JSON))["scripts"].get("check", "")
    return diff_commands(
        pnpm_scripts_in_gate_workflow() - set(WORKFLOW_ONLY),
        pnpm_scripts_in_check(check) - set(CHECK_ONLY),
    )


def main() -> int:
    required_names = ["APP_ORIGIN"]

    problems: list[str] = []
    for path in sorted(WORKFLOW_DIR.glob("*.yml")):
        problems.extend(audit_workflow(path))
    problems.extend(audit_dockerfile(DOCKERFILE, required_names))
    problems.extend(audit_drift())

    if problems:
        print(f"CI 구성 규칙 위반 {len(problems)}건", file=sys.stderr)
        for problem in problems:
            print(f"- {problem}", file=sys.stderr)
        return 1

    print("CI 구성 검사 통과")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
