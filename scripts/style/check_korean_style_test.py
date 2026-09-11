#!/usr/bin/env python3
"""문체 게이트의 판정을 고정한다.

위반을 잡는지만 보면 부족하다. 정상 문장을 막지 않는지도 같이 고정해야 룰을
넓히다가 오탐을 만드는 것을 잡을 수 있다. 실제로 `복원한다`가 `원한다`에 걸린
오탐이 한 번 나왔고, 그 케이스를 아래에 남겼다.
"""

from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from check_korean_style import check_text, iter_comment_lines, main  # noqa: E402

CHECKER = Path(__file__).resolve().parent / "check_korean_style.py"


def names(text: str) -> list[str]:
    return [rule.name for rule in check_text(text)]


class 의인화(unittest.TestCase):
    def test_원한다를_잡는다(self):
        self.assertEqual(names("서버가 절대 URL을 원한다"), ["의인화: 원한다"])

    def test_복원한다는_통과시킨다(self):
        # 앞 음절이 한글이면 다른 낱말이다. 룰을 좁히기 전에는 이 문장이 걸렸다.
        self.assertEqual(names("세션의 식별 정보를 복원한다"), [])

    def test_지원한다도_통과시킨다(self):
        self.assertEqual(names("새 러너 이미지를 지원한다"), [])

    def test_똑똑하게를_잡는다(self):
        self.assertEqual(names("캐시가 똑똑하게 판단한다"), ["의인화: 똑똑하게"])


class 영어식_직역(unittest.TestCase):
    def test_가진_타입을_잡는다(self):
        self.assertEqual(names("status를 가진 타입으로 승격한다"), ["직역: 을 가진다"])

    def test_있는_타입은_통과시킨다(self):
        self.assertEqual(names("status가 있는 타입으로 승격한다"), [])

    def test_에_의해를_잡는다(self):
        self.assertEqual(names("훅에 의해 차단된다"), ["직역: 에 의해"])

    def test_이중_피동을_잡는다(self):
        self.assertEqual(names("로그에 남겨진다고 보여진다"), ["직역: 이중 피동"])

    def test_필요가_있다를_잡는다(self):
        # 앞 용언을 `할`·`될`로 고정했더니 `좁힐 필요가 있다`가 빠졌다.
        self.assertEqual(names("범위를 좁힐 필요가 있다"), ["직역: 필요가 있다"])
        self.assertEqual(names("값을 더 받을 필요가 있다"), ["직역: 필요가 있다"])

    def test_필요하다는_통과시킨다(self):
        self.assertEqual(names("runtime에도 같은 값이 필요하다"), [])

    def test_우리는을_잡는다(self):
        self.assertEqual(names("우리는 node에서 가로챈다"), ["직역: 우리는"])


class 인용_예외(unittest.TestCase):
    def test_백틱_인용은_검사하지_않는다(self):
        # 룰 설명이 나쁜 표현을 인용해야 하는데, 그때 규칙이 자기 설명을 막았다.
        self.assertEqual(names("`좁힐 필요가 있다`가 빠져서 룰을 넓혔다"), [])

    def test_인용_밖의_표현은_그대로_잡는다(self):
        self.assertEqual(
            names("`예시`를 넣을 필요가 있다"), ["직역: 필요가 있다"]
        )


class 콩글리시(unittest.TestCase):
    def test_체크한다를_잡는다(self):
        self.assertEqual(names("캐시 키를 체크한다"), ["콩글리시: 체크한다"])

    def test_확인한다는_통과시킨다(self):
        self.assertEqual(names("캐시 키를 확인한다"), [])


class 기술_용어_보존(unittest.TestCase):
    def test_영문_기술_용어는_대상이_아니다(self):
        # 기술 용어 자체의 의미를 훼손하지 않는다는 규칙이 코드에서도 성립해야 한다.
        self.assertEqual(names("cache hit과 miss의 install 시간 차이를 남긴다"), [])

    def test_한글이_없는_주석은_대상이_아니다(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "sample.ts"
            path.write_text("// we have a value here\nexport const a = 1\n", "utf8")
            self.assertEqual(iter_comment_lines(path), [])


class 주석_추출(unittest.TestCase):
    def test_코드_문자열은_검사하지_않는다(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "sample.ts"
            path.write_text("export const message = '값을 가진다'\n", "utf8")
            self.assertEqual(iter_comment_lines(path), [])

    def test_URL은_주석으로_보지_않는다(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "sample.ts"
            path.write_text("const url = 'https://example.com/값을 가진다'\n", "utf8")
            self.assertEqual(iter_comment_lines(path), [])

    def test_블록_주석도_읽는다(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "sample.ts"
            path.write_text("/*\n * 값을 가진다\n */\n", "utf8")
            self.assertEqual(len(iter_comment_lines(path)), 1)

    def test_yaml_주석도_읽는다(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "sample.yml"
            path.write_text("# 값을 가진다\nname: x\n", "utf8")
            self.assertEqual(len(iter_comment_lines(path)), 1)


class 종료_코드(unittest.TestCase):
    def test_위반이_있으면_1을_반환한다(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "sample.ts"
            path.write_text("// status를 가진 타입이다\n", "utf8")
            self.assertEqual(main([str(path)]), 1)

    def test_위반이_없으면_0을_반환한다(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "sample.ts"
            path.write_text("// status가 있는 타입이다\n", "utf8")
            self.assertEqual(main([str(path)]), 0)

    def test_CLI로도_같은_판정을_낸다(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "sample.ts"
            path.write_text("// 캐시 키를 체크한다\n", "utf8")
            result = subprocess.run(
                [sys.executable, str(CHECKER), str(path)],
                capture_output=True,
                text=True,
            )
            self.assertEqual(result.returncode, 1)
            self.assertIn("콩글리시: 체크한다", result.stderr)


if __name__ == "__main__":
    unittest.main(verbosity=2)
