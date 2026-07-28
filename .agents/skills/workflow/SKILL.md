---
name: workflow
description: Fork 기반 Git 워크플로우, develop·feature 브랜치 생성과 동기화, upstream 제출 PR, push·merge 및 머지 전 검증 요청에 사용한다.
---

# 워크플로우 규칙

## 브랜치 역할

- `upstream/main`: 멘토가 공통 코드를 업데이트하는 원본 브랜치로 취급한다.
- `origin/main`: `upstream/main`의 Fork Sync 전용 브랜치로 유지한다. 과제 코드를 merge하지 않는다.
- `origin/develop`: 완료한 과제를 누적하고 다음 feature의 기준으로 사용한다.
- `feat/week-<week-number>-<description>`: 한 주차의 과제를 구현하는 작업 브랜치로 사용한다.
- `upstream/im-wen3y`: 과제 제출 PR의 base 브랜치로 사용한다.

## 과제 시작부터 완료까지

다음 순서를 지킨다.

1. 멘토가 변경한 `upstream/main`을 `origin/main`에 Fork Sync한다.
2. 최신 `origin/main`을 `origin/develop`에 merge한다.
3. 최신 `develop`에서 feature 브랜치를 생성한다.
4. 과제를 구현하고 feature 브랜치에 push한다.
5. `feat/week-xx`에서 `upstream/im-wen3y`로 제출 PR을 생성한다.
6. 리뷰 내용을 동일한 feature 브랜치에 반영한다.
7. 리뷰 완료 후 upstream 제출 PR을 merge한다.
8. 동일한 `feat/week-xx`를 `origin/develop`에도 merge한다.
9. 다음 과제는 최신 `develop`에서 새 feature 브랜치를 생성한다.

```text
upstream/main ──Fork Sync──> origin/main
                                  │
                                  ▼ merge
                           origin/develop
                                  │
                                  ▼ branch
                         feat/week-xx
                           │          │
                           │          └── merge ──> origin/develop
                           └── PR ──> upstream/im-wen3y
```

## 동기화 원칙

- feature 브랜치는 `main`이 아니라 최신 `develop`에서 생성한다.
- 원본 변경 반영은 `upstream/main → origin/main → origin/develop` 방향으로만 진행한다.
- 과제 코드를 `develop → origin/main`으로 merge하지 않는다.
- 공유하는 `develop`에는 rebase보다 merge를 사용해 push된 커밋의 해시를 보존한다.
- upstream 제출 PR이 merge되어도 `origin/develop` 반영을 생략하지 않는다.
- 동일 feature를 upstream과 develop에 반영했는지 다음 과제 시작 전에 확인한다.

## 브랜치 네이밍

`feat/week-<week-number>-<description>` 형식을 사용한다.

```text
feat/week-06-product-detail
```

## 머지 전 체크

- 변경 범위와 대상 base 브랜치를 확인한다.
- `pnpm format`을 실행한다.
- lint와 타입 검사를 통과한다.
- 사용자가 런타임 검증을 요청했다면 관련 테스트 결과도 확인한다.
