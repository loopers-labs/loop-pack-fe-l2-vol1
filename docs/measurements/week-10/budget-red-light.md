# 번들 예산 게이트 빨간불 증거

Actions 로그는 기본 보존 기간이 지나면 사라진다. 그래서 PR 화면에 보인 출력을 원문으로 여기 남긴다.

## 1차 — 예산선을 낮춰 만든 빨간불

예산선만 500 KiB로 낮춰 비교 단계를 확인했다. 측정값은 실제 build 산출물이지만 **build부터 진단 파일, 측정까지의 앞 구간은 이 실험으로 증명되지 않는다.**

- PR [#5](https://github.com/hyungkishin/loop-pack-fe-l2-vol1/pull/5) · [run 34541923894](https://github.com/hyungkishin/loop-pack-fe-l2-vol1/actions/runs/34541923894)
- 실패 스텝: `Check bundle budget`

```
| 라우트 | 현재 비압축 JS | 예산 | 차이 | 결과 |
| --- | ---: | ---: | ---: | --- |
| / | 588.4 KiB | 500.0 KiB | +88.4 KiB | 실패 |
| /products | 604.6 KiB | 635.0 KiB | -30.4 KiB | 통과 |
번들 예산 초과: / 588.4 KiB / 예산 500.0 KiB (88.4 KiB 초과)
```

## 2차 — 실제 의존성을 추가해 만든 빨간불

`lodash`를 홈 라우트 클라이언트 컴포넌트에서 무의미하게 import했다. 예산선은 그대로 618 KiB다. **build → 진단 파일 → 측정 → 예산 비교 → 기준선 비교 전 구간이 증명된다.**

- PR [#15](https://github.com/hyungkishin/loop-pack-fe-l2-vol1/pull/15) · [run 34597699533](https://github.com/hyungkishin/loop-pack-fe-l2-vol1/actions/runs/34597699533)
- `static` success, `runtime` failure — 실패가 예산 게이트에 격리된다
- 실패 스텝: `Check bundle budget`

```
| 라우트 | 현재 비압축 JS | 예산 | 차이 | 결과 |
| --- | ---: | ---: | ---: | --- |
| / | 656.8 KiB | 618.0 KiB | +38.8 KiB | 실패 |
| /products | 604.6 KiB | 635.0 KiB | -30.4 KiB | 통과 |
| /login | 563.4 KiB | 592.0 KiB | -28.6 KiB | 통과 |
| /orders | 569.8 KiB | 599.0 KiB | -29.2 KiB | 통과 |
| /orders/new | 563.8 KiB | 593.0 KiB | -29.2 KiB | 통과 |

기준선과 다른 라우트 1개
- /: 672546 B (기준선 602487 B, +70059 B)
번들이 바뀐 이유를 PR에 적고 `pnpm size:baseline`으로 기준선을 갱신합니다.
번들 기준선 불일치: / +70059 B
번들 예산 초과: / 656.8 KiB / 예산 618.0 KiB (38.8 KiB 초과)
```

두 층이 함께 발화한다. 예산 초과 38.8 KiB와 기준선 증가 70,059 B는 같은 원인을 서로 다른 기준으로 보고한다. 예산은 "넘지 말아야 하는 선"이고 기준선은 "달라졌다는 사실"이다.

## 2차 로그에서 고친 것

이 실행의 로그에 기준선 보고가 두 번 찍혔다. 같은 블록을 stdout과 stderr에 모두 쓴 탓이다. 로그에서 두 건으로 읽히므로 stderr에는 실패 이유 한 줄만 남기게 고쳤다. 위 출력은 수정 후 기준이고, 수정 전 로그에는 같은 블록이 연달아 두 번 나온다.

## 복구

두 실험 브랜치는 병합하지 않는다. 2차는 `lodash`와 `@types/lodash`, 홈 컴포넌트의 측정용 import를 담고 있어 `measure/week10-budget-real`에만 있다. 제출 브랜치에는 들어가지 않는다.
