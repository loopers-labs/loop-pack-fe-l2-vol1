---
name: architecture-review
description: 프로젝트의 폴더 구조와 모듈 간 의존 관계를 분석한다.
  FSD 레이어 규칙 준수 여부, 순환 의존, 응집도/결합도를 점검하고
  구조적 리스크를 드러낸다.
  코드 수정안을 제시하지 않으며, 구조적 판단만 제공한다.
---

### 분석 순서

1. 현재 폴더 구조를 FSD 레이어(app/pages/widgets/features/entities/shared)로 매핑
2. import 방향이 상위→하위 규칙을 지키는지 확인
3. features 간 직접 의존이 있는지 탐지
4. entities 내부에 UI 코드가 섞여 있는지 확인
5. shared에 비즈니스 로직이 포함되어 있는지 확인
6. 리스크를 "현재 문제 / 확장 시 문제 / 대안"으로 분류해 제시
