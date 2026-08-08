# 원본 Lighthouse 리포트

문서와 추출 산출물이 보고한 수치를 **원본에서 직접 감사할 수 있게** 회차별 리포트를 그대로
보관한다. 압축만 했고 내용은 손대지 않았다.

- 회차마다 개별 `.json.gz` 파일이다. 파일명이 추출 산출물과 회차에 1:1로 대응한다.
- `gzip -n`으로 만들어 타임스탬프가 들어가지 않는다. 같은 입력이면 같은 파일이 나온다.
- 44개 회차, 압축 5.7 MB.

## 읽기

```bash
gunzip -c lighthouse-home-after-run-1.json.gz | jq '.audits["first-contentful-paint"].numericValue'
```

전부 풀어서 보려면 다음과 같이 한다. 원본은 회차당 약 550 KB다.

```bash
mkdir -p /tmp/week-07-raw
for f in *.json.gz; do gunzip -c "$f" > "/tmp/week-07-raw/${f%.gz}"; done
```

## 무결성 확인

```bash
shasum -a 256 -c SHA256SUMS
```

`manifest.json`은 `scripts/measure/raw-manifest.mjs`가 만든다. 그룹별 측정 조건과 회차별 해시가 함께 있다. 압축 파일의 `sha256`과
압축을 푼 원본의 `uncompressedSha256`을 모두 기록해, 압축 방식이 달라져도 원본을 대조할 수 있다.

## 그룹과 측정 조건

| 추출 산출물 | measuredSha | 감속 | 회차 | 차단 패턴 |
| --- | --- | --- | --- | --- |
| `lighthouse-home-before.json` | `3aa1981` | simulate | 5 | 없음 |
| `lighthouse-home-after.json` | `0785d2c` | simulate | 5 | 없음 |
| `lighthouse-products-before.json` | `3aa1981` | simulate | 5 | 없음 |
| `lighthouse-products-after.json` | `36e31e0` | simulate | 5 | 없음 |
| `lighthouse-fcp-exp1-hero-blocked.json` | `fff007f` | simulate | 5 | `*hero-original*` |
| `lighthouse-fcp-exp2-fonts-blocked.json` | `fff007f` | simulate | 5 | `*PretendardVariable*` |
| `lighthouse-fcp-exp3-latin-simulate.json` | `fff007f` | simulate | 5 | 없음 |
| `lighthouse-fcp-exp4-korean-devtools.json` | `fff007f` | devtools | 3 | 없음 |
| `lighthouse-fcp-exp5-latin-devtools.json` | `fff007f` | devtools | 3 | 없음 |
| `lighthouse-fcp-exp6-before-devtools.json` | `3aa1981` | devtools | 3 | 없음 |

exp3과 exp5는 `fff007f` 그대로가 아니라 셸 문구만 라틴 문자로 임시 치환한 상태에서 쟀다.
이 사실은 `manifest.json`과 해당 추출 JSON의 `conditions.variant`에도 들어 있다. exp6은
`3aa1981`을 별도 worktree에 체크아웃해 빌드했다.

## 추출 절차

추출 산출물은 이 원본에서 `scripts/measure/lighthouse.mjs`로 만든다.

```bash
MEASURE_SHA=0785d2c MEASURE_LH_RAW_DIR=<압축을 푼 디렉터리> MEASURE_LABEL=home-after \
  node scripts/measure/lighthouse.mjs
```

## 민감정보

커밋 전에 로컬 절대경로(`/Users/`, `/private/tmp`), `user-data-dir`, `authorization`,
`cookie`, API key, token을 검사했고 모두 0건이었다. 측정 대상이 로컬 `127.0.0.1` 서버라
외부 자격 증명이 들어갈 경로가 없다.
