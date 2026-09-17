#!/usr/bin/env python3
"""CI 구성 검사의 판정을 고정한다.

세 규칙 모두 이 저장소에서 실제로 겪은 실수에서 나왔다. 되돌린 코드를 그대로
입력으로 넣어 검사가 잡는지 확인한다. 룰을 만들다 낸 오탐도 케이스로 남긴다.
"""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from audit_ci import (  # noqa: E402
    audit_dockerfile,
    audit_workflow,
    diff_commands,
    pnpm_scripts_in_check,
)

MINIMAL = """name: X

'on':
  pull_request:

permissions:
  contents: read

jobs:
  a:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0
"""


def check(text: str) -> list[str]:
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / "w.yml"
        path.write_text(text, "utf8")
        return audit_workflow(path)


class workflow_보안(unittest.TestCase):
    def test_기준_workflow는_통과한다(self):
        self.assertEqual(check(MINIMAL), [])

    def test_permissions가_없으면_잡는다(self):
        text = MINIMAL.replace("permissions:\n  contents: read\n\n", "")
        self.assertIn("최상위 permissions가 없다", check(text)[0])

    def test_넓은_permissions를_잡는다(self):
        text = MINIMAL.replace("contents: read", "contents: write")
        self.assertIn("contents: read로 좁힌다", check(text)[0])

    def test_pull_request_target_트리거를_잡는다(self):
        text = MINIMAL.replace("  pull_request:", "  pull_request_target:")
        self.assertTrue(any("pull_request_target" in p for p in check(text)))

    def test_주석의_pull_request_target은_위반이_아니다(self):
        # 이 트리거를 왜 피하는지 주석으로 설명하는 것까지 막던 오탐이 있었다.
        text = MINIMAL.replace(
            "jobs:", "# pull_request_target과 같은 부류라 피한다\njobs:"
        )
        self.assertEqual(check(text), [])

    def test_권한있는_트리거의_신뢰못할_checkout을_잡는다(self):
        # deployment-smoke.yml이 실제로 이 모양이었다.
        text = MINIMAL.replace("  pull_request:", "  deployment_status:").replace(
            "      - uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0",
            "      - uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0\n"
            "        with:\n"
            "          ref: ${{ github.event.deployment.sha }}",
        )
        problems = check(text)
        self.assertTrue(any("github.event.deployment.sha" in p for p in problems))

    def test_기본브랜치_checkout은_통과한다(self):
        text = MINIMAL.replace("  pull_request:", "  deployment_status:").replace(
            "      - uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0",
            "      - uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0\n"
            "        with:\n"
            "          ref: ${{ github.event.repository.default_branch }}",
        )
        self.assertEqual(check(text), [])

    def test_태그로_핀한_action을_잡는다(self):
        text = MINIMAL.replace(
            "actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0",
            "actions/checkout@v4",
        )
        self.assertTrue(any("commit SHA로 핀한다" in p for p in check(text)))

    def test_timeout이_없는_job을_잡는다(self):
        text = MINIMAL.replace("    timeout-minutes: 10\n", "")
        self.assertTrue(any("timeout-minutes" in p for p in check(text)))

    def test_pull_request에서_secrets를_쓰면_잡는다(self):
        text = MINIMAL + "        env:\n          T: ${{ secrets.TOKEN }}\n"
        self.assertTrue(any("secrets를 쓰지 않는다" in p for p in check(text)))


class dockerfile_계약(unittest.TestCase):
    def dockerfile(self, body: str) -> list[str]:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "Dockerfile"
            path.write_text(body, "utf8")
            return audit_dockerfile(path, ["APP_ORIGIN"])

    def test_필수_변수의_기본값을_잡는다(self):
        # Dockerfile이 실제로 이 모양이었고 env:check가 이 값으로 통과했다.
        problems = self.dockerfile("ARG APP_ORIGIN=http://127.0.0.1:3000\n")
        self.assertEqual(len(problems), 1)
        self.assertIn("build 기본값을 두지 않는다", problems[0])

    def test_기본값_없는_ARG는_통과한다(self):
        self.assertEqual(self.dockerfile("ARG APP_ORIGIN\n"), [])

    def test_필수가_아닌_변수의_기본값은_통과한다(self):
        self.assertEqual(self.dockerfile("ARG NODE_VERSION=24.17.0\n"), [])


class 진실_소스_일치(unittest.TestCase):
    def test_workflow에만_있으면_잡는다(self):
        problems = diff_commands({"lint", "style:check"}, {"lint"})
        self.assertEqual(len(problems), 1)
        self.assertIn("check 스크립트에 없다", problems[0])

    def test_check에만_있으면_잡는다(self):
        problems = diff_commands({"lint"}, {"lint", "typecheck"})
        self.assertEqual(len(problems), 1)
        self.assertIn("CI가 실행하지 않는다", problems[0])

    def test_같으면_통과한다(self):
        self.assertEqual(diff_commands({"lint"}, {"lint"}), [])

    def test_check_스크립트에서_명령을_뽑는다(self):
        found = pnpm_scripts_in_check(
            "pnpm lint && APP_ORIGIN=http://x pnpm build && pnpm size:check"
        )
        self.assertEqual(found, {"lint", "build", "size:check"})


if __name__ == "__main__":
    unittest.main(verbosity=2)
