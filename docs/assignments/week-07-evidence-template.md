# Week 7 성능 최적화 증거 템플릿

이 파일을 `docs/assignments/week-07-evidence.md`로 복사한 뒤 측정 원본의 저장 위치와 판단 근거를 채워요. 자동 검증은 필수 칸이 채워졌는지만 확인하고, 측정의 타당성과 성능 판단은 멘토가 원본을 열어 직접 검토해요.

```yaml
week07_submission_version: 1
advanced: <none 또는 a>
measured_commit_sha: <필수>
production_command: <필수>
browser_profile: <필수>
viewport: <필수>
cpu_throttling: <필수>
network_throttling: <필수>
browser_and_lighthouse_version: <필수>
measurement_date: <필수>
```

## Basic 1

```yaml
basic_1_home_route: <필수>
basic_1_products_route: <필수>
basic_1_user_action: <필수>
basic_1_before_lighthouse_fcp_5_runs: <필수>
basic_1_before_lighthouse_lcp_5_runs: <필수>
basic_1_before_lighthouse_cls_5_runs: <필수>
basic_1_before_summary_min_median_max: <필수>
basic_1_before_filmstrip: <필수 원본 위치>
basic_1_before_waterfall: <필수 원본 위치>
basic_1_initial_list_video: <필수 원본 위치>
basic_1_refresh_list_video: <필수 원본 위치>
basic_1_request_order: <필수 원본 위치>
basic_1_observation: <필수>
basic_1_hypothesis: <필수>
basic_1_falsification: <필수>
basic_1_smallest_change: <필수>
```

## Basic 2

```yaml
basic_2_implementation_paths: <필수>
basic_2_rendering_boundary: <필수>
basic_2_data_owner: <필수>
basic_2_shell_filmstrip: <필수 원본 위치>
basic_2_layout_shifts: <필수 원본 위치>
basic_2_after_lighthouse_5_runs: <필수>
basic_2_network_waterfall: <필수 원본 위치>
basic_2_decision: <필수>
```

## Basic 3

```yaml
basic_3_implementation_paths: <필수>
basic_3_initial_pending_video: <필수 원본 위치>
basic_3_refresh_feedback_video: <필수 원본 위치>
basic_3_request_cancellation: <필수 원본 위치 또는 무개입 근거>
basic_3_final_url_result: <필수 원본 위치>
basic_3_state_semantics: <필수>
basic_3_conditional_optimization: <필수>
basic_3_conditional_decision: <필수 적용 증거 또는 무개입 근거>
```

## Basic 4

```yaml
basic_4_implementation_paths: <필수>
basic_4_document_source: <필수 원본 위치>
basic_4_metadata_title_description: <필수>
basic_4_semantic_structure: <필수>
basic_4_navigation_links: <필수>
basic_4_image_alt: <필수>
```

## Basic 5

```yaml
basic_5_after_lighthouse_fcp_5_runs: <필수>
basic_5_after_lighthouse_lcp_5_runs: <필수>
basic_5_after_lighthouse_cls_5_runs: <필수>
basic_5_after_summary_min_median_max: <필수>
basic_5_after_filmstrip: <필수 원본 위치>
basic_5_after_waterfall: <필수 원본 위치>
basic_5_regression_url_history: <필수>
basic_5_regression_cart_wishlist: <필수>
basic_5_regression_loading_error_empty: <필수>
basic_5_regression_fsd: <필수>
basic_5_ineffective_or_worse_result: <필수>
basic_5_final_decision: <필수 되돌림 또는 유지 근거>
```

## Advanced A

Advanced A를 선택하지 않았다면 이 절은 템플릿에 남겨 두되 `advanced: none`으로 제출해요. 선택했다면 Basic 1~5를 먼저 완료하고 아래를 모두 채워요.

```yaml
advanced_a_route: /performance-lab/inp?pageSize=24
advanced_a_cpu_throttling: 4x slowdown
advanced_a_before_trace: <필수 원본 위치>
advanced_a_after_trace: <필수 원본 위치>
advanced_a_before_profiler: <필수 원본 위치>
advanced_a_after_profiler: <필수 원본 위치>
advanced_a_before_interaction_ms_3_runs: <필수>
advanced_a_after_interaction_ms_3_runs: <필수>
advanced_a_before_rendered_card_count: <필수>
advanced_a_after_rendered_card_count: <필수>
advanced_a_root_cause: <필수>
advanced_a_decision: <필수>
```

## 멘토 수동 검토 체크리스트

- [ ] Before와 After가 같은 production build 조건인지 확인했다.
- [ ] Lighthouse 5회 원값과 중앙값·최솟값·최댓값을 원본에서 확인했다.
- [ ] filmstrip·waterfall·Layout Shifts·초기 HTML 원본을 열었다.
- [ ] 관찰·가설·반증·가장 작은 변경이 같은 원인을 가리키는지 확인했다.
- [ ] 조건부 최적화의 적용 증거 또는 무개입 근거를 확인했다.
- [ ] 변화가 없거나 악화된 결과와 되돌림·유지 판단을 숨기지 않았는지 확인했다.
- [ ] 기능·URL·상태·FSD 회귀 결과를 확인했다.
- [ ] Advanced A를 선택했다면 trace와 Profiler에서 관계없는 렌더 원인을 확인했다.
