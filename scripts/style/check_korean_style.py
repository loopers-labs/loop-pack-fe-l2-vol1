#!/usr/bin/env python3
"""코드 주석의 한국어 문체를 검사한다.

팀 규칙: 불필요한 의인화를 쓰지 않고, 영어식 직역 표현은 한국어에서 실제로 쓰는
표현으로 쓴다. 기술 용어 자체는 그대로 둔다.

문체 전부를 기계가 판정할 수는 없다. 그래서 이 게이트는 좁게 둔다. 반복해서
지적된 표현만 목록으로 고정하고, 판단이 필요한 나머지는 사람 리뷰에 남긴다.
목록에 없는 표현을 통과시키는 것은 설계이지 누락이 아니다.

검사 대상은 주석뿐이다. 화면에 나가는 문자열과 문서 산문은 다른 기준이 필요하다.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

HANGUL = re.compile(r"[가-힣]")

SLASH_COMMENT_SUFFIXES = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"}
HASH_COMMENT_SUFFIXES = {".yml", ".yaml", ".py", ".sh"}

DEFAULT_PATHS = ("src", "scripts", "e2e", ".github/workflows")
DEFAULT_FILES = ("eslint.config.mjs", "next.config.ts", "vitest.config.ts")


@dataclass(frozen=True)
class Rule:
    name: str
    pattern: re.Pattern[str]
    advice: str


RULES: tuple[Rule, ...] = (
    # 의인화 — 코드에 의지나 감정을 붙이는 표현
    Rule(
        "의인화: 원한다",
        # 앞 음절이 한글이면 복원한다·지원한다 같은 다른 낱말이다. 오탐을 막는다.
        re.compile(r"(?<![가-힣])(원한다|원하지\s*않는다|원하는\s*대로)"),
        "필요하다 / 필요 없다처럼 요구 조건으로 쓴다",
    ),
    Rule(
        "의인화: 좋아한다",
        re.compile(r"(좋아한다|싫어한다|반가워한다)"),
        "동작이나 조건을 그대로 쓴다",
    ),
    Rule(
        "의인화: 똑똑하게",
        re.compile(r"(똑똑하게|영리하게|알아서\s*척척|스스로\s*생각)"),
        "무엇을 어떤 기준으로 하는지 쓴다",
    ),
    Rule(
        "의인화: 도와준다",
        re.compile(r"도와준다"),
        "무엇에 쓰는지 쓴다",
    ),
    Rule(
        "의인화: 죽는다",
        re.compile(r"(프로세스|서버|컨테이너|job)[가이]?\s*(죽는다|죽어|살아난다)"),
        "종료된다 / 재시작된다",
    ),
    # 영어식 직역 — 한국어에서 쓰지 않는 어순과 피동
    Rule(
        "직역: 을 가진다",
        re.compile(r"[을를]\s*가(진다|지고\s*있다|진\b)"),
        "~이 있다 / ~을 쓴다",
    ),
    Rule(
        "직역: 에 의해",
        re.compile(r"에\s*의해"),
        "능동으로 바꾼다",
    ),
    Rule(
        "직역: 이중 피동",
        re.compile(r"(되어진다|되어져|지어진다|불려진다|보여진다|쓰여진다)"),
        "된다 / 쓰인다",
    ),
    Rule(
        "직역: 필요가 있다",
        # 앞 용언이 무엇이든 걸리게 둔다. `좁힐 필요가 있다`가 빠져 오탐의 반대인
        # 미탐이 났다. 한국어에서는 `필요하다` 또는 `해야 한다`로 쓴다.
        re.compile(r"필요가\s*있다"),
        "해야 한다",
    ),
    Rule(
        "직역: 되어야만 한다",
        re.compile(r"되어야만\s*한다"),
        "해야 한다",
    ),
    Rule(
        "직역: 하는 것을 허용",
        re.compile(r"하는\s*것을\s*허용"),
        "~할 수 있다",
    ),
    Rule(
        "직역: 가장 ~ 것 중 하나",
        re.compile(r"가장\s.{1,12}\s*것\s*중\s*하나"),
        "단정하거나 근거를 쓴다",
    ),
    Rule(
        "직역: 우리는",
        re.compile(r"(^|[\s(])우리는"),
        "주어를 생략한다",
    ),
    Rule(
        "직역: 에 대해서",
        re.compile(r"에\s*대해서"),
        "~을 / ~의 로 줄인다",
    ),
    # 콩글리시 동사 — 한국어 동사가 이미 있는 자리
    Rule(
        "콩글리시: 체크한다",
        re.compile(r"체크(한다|하고|해서|해야|하지)"),
        "확인한다",
    ),
    Rule(
        "콩글리시: 핸들링",
        re.compile(r"(핸들링|핸들한다|케어한다|이슈가\s*있다)"),
        "처리한다 / 문제가 있다",
    ),
)


def iter_comment_lines(path: Path) -> list[tuple[int, str]]:
    """파일에서 주석 줄만 뽑는다. 한글이 없는 줄은 검사 대상이 아니다."""
    suffix = path.suffix
    try:
        text = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return []

    comments: list[tuple[int, str]] = []
    in_block = False

    for number, line in enumerate(text.splitlines(), start=1):
        stripped = line.strip()
        comment = ""

        if suffix in SLASH_COMMENT_SUFFIXES:
            if in_block:
                comment = stripped
                if "*/" in stripped:
                    in_block = False
            elif stripped.startswith("/*"):
                comment = stripped
                in_block = "*/" not in stripped
            else:
                # URL의 //와 구분한다. 주석 기호 앞에 :가 붙으면 URL이다.
                match = re.search(r"(?<!:)//(.*)$", line)
                if match:
                    comment = match.group(1)
        elif suffix in HASH_COMMENT_SUFFIXES:
            if stripped.startswith("#"):
                comment = stripped

        if comment and HANGUL.search(comment):
            comments.append((number, comment))

    return comments


# 백틱 인용은 검사에서 뺀다. 룰이 왜 있는지 적으려면 나쁜 표현을 인용해야 하고,
# 그때 규칙이 자기 설명을 막는다. 인용을 우회로로 쓸 수 있다는 것은 알고 받아들인다.
QUOTED = re.compile(r"`[^`]*`")


def strip_quotes(text: str) -> str:
    return QUOTED.sub(" ", text)


def check_text(text: str) -> list[Rule]:
    target = strip_quotes(text)
    return [rule for rule in RULES if rule.pattern.search(target)]


def collect_files(paths: list[str]) -> list[Path]:
    found: list[Path] = []
    suffixes = SLASH_COMMENT_SUFFIXES | HASH_COMMENT_SUFFIXES

    for raw in paths:
        path = Path(raw)
        if path.is_dir():
            found.extend(
                child
                for child in sorted(path.rglob("*"))
                if child.is_file() and child.suffix in suffixes
            )
        elif path.is_file() and path.suffix in suffixes:
            found.append(path)

    return found


def staged_files() -> list[str]:
    result = subprocess.run(
        ["git", "diff", "--cached", "--name-only", "--diff-filter=ACMR"],
        capture_output=True,
        text=True,
        check=True,
    )
    return [name for name in result.stdout.splitlines() if name]


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="코드 주석의 한국어 문체를 검사한다.")
    parser.add_argument("paths", nargs="*", help="검사할 경로. 비우면 기본 경로를 쓴다.")
    parser.add_argument(
        "--staged", action="store_true", help="staged 파일만 검사한다."
    )
    args = parser.parse_args(argv)

    if args.staged:
        targets = collect_files(staged_files())
    elif args.paths:
        targets = collect_files(args.paths)
    else:
        targets = collect_files([*DEFAULT_PATHS, *DEFAULT_FILES])

    failures: list[str] = []
    for path in targets:
        for number, comment in iter_comment_lines(path):
            for rule in check_text(comment):
                failures.append(
                    f"{path}:{number}  {rule.name} -> {rule.advice}\n    {comment.strip()}"
                )

    if failures:
        print(f"주석 문체 규칙 위반 {len(failures)}건", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        print(
            "\n목록에 없는 표현은 사람 리뷰가 본다. 목록에 있는 표현은 고쳐야 통과한다.",
            file=sys.stderr,
        )
        return 1

    print(f"주석 문체 검사 통과: 파일 {len(targets)}개")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
