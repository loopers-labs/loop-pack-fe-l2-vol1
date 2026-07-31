import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const selectedAdvanced = process.argv
  .find((argument) => argument.startsWith("--advanced="))
  ?.slice("--advanced=".length);

function infraError(message) {
  console.error(`[INFRA_ERROR] ${message}`);
  return 1;
}

function incomplete(message) {
  console.error(`[INCOMPLETE] ${message}`);
  return 2;
}

function parseEvidence(source) {
  const fields = new Map();

  for (const line of source.split("\n")) {
    const match = line.match(/^([a-z0-9_]+):\s*(.*)$/);
    if (match) {
      fields.set(match[1], match[2].trim());
    }
  }

  return fields;
}

function isIncompleteValue(value) {
  return (
    value === undefined ||
    value === "" ||
    /\b(?:TODO|TBD)\b/i.test(value) ||
    /<[^>]*>/.test(value) ||
    /\[필수[^\]]*\]/.test(value) ||
    /^(?:미작성|없음)$/i.test(value)
  );
}

const basicRequiredFields = [
  "week07_submission_version",
  "advanced",
  "measured_commit_sha",
  "production_command",
  "browser_profile",
  "viewport",
  "cpu_throttling",
  "network_throttling",
  "browser_and_lighthouse_version",
  "measurement_date",
  "basic_1_home_route",
  "basic_1_products_route",
  "basic_1_user_action",
  "basic_1_before_lighthouse_fcp_5_runs",
  "basic_1_before_lighthouse_lcp_5_runs",
  "basic_1_before_lighthouse_cls_5_runs",
  "basic_1_before_summary_min_median_max",
  "basic_1_before_filmstrip",
  "basic_1_before_waterfall",
  "basic_1_initial_list_video",
  "basic_1_refresh_list_video",
  "basic_1_request_order",
  "basic_1_observation",
  "basic_1_hypothesis",
  "basic_1_falsification",
  "basic_1_smallest_change",
  "basic_2_implementation_paths",
  "basic_2_rendering_boundary",
  "basic_2_data_owner",
  "basic_2_shell_filmstrip",
  "basic_2_layout_shifts",
  "basic_2_after_lighthouse_5_runs",
  "basic_2_network_waterfall",
  "basic_2_decision",
  "basic_3_implementation_paths",
  "basic_3_initial_pending_video",
  "basic_3_refresh_feedback_video",
  "basic_3_request_cancellation",
  "basic_3_final_url_result",
  "basic_3_state_semantics",
  "basic_3_conditional_optimization",
  "basic_3_conditional_decision",
  "basic_4_implementation_paths",
  "basic_4_document_source",
  "basic_4_metadata_title_description",
  "basic_4_semantic_structure",
  "basic_4_navigation_links",
  "basic_4_image_alt",
  "basic_5_after_lighthouse_fcp_5_runs",
  "basic_5_after_lighthouse_lcp_5_runs",
  "basic_5_after_lighthouse_cls_5_runs",
  "basic_5_after_summary_min_median_max",
  "basic_5_after_filmstrip",
  "basic_5_after_waterfall",
  "basic_5_regression_url_history",
  "basic_5_regression_cart_wishlist",
  "basic_5_regression_loading_error_empty",
  "basic_5_regression_fsd",
  "basic_5_ineffective_or_worse_result",
  "basic_5_final_decision",
];

const advancedARequiredFields = [
  "advanced_a_route",
  "advanced_a_cpu_throttling",
  "advanced_a_before_trace",
  "advanced_a_after_trace",
  "advanced_a_before_profiler",
  "advanced_a_after_profiler",
  "advanced_a_before_interaction_ms_3_runs",
  "advanced_a_after_interaction_ms_3_runs",
  "advanced_a_before_rendered_card_count",
  "advanced_a_after_rendered_card_count",
  "advanced_a_root_cause",
  "advanced_a_decision",
];

async function main() {
  if (!["none", "a"].includes(selectedAdvanced)) {
    return infraError(
      "--advanced=none 또는 --advanced=a 중 하나를 지정하세요.",
    );
  }

  const scopes = ["basic-checkpoints"];
  if (selectedAdvanced === "a") {
    scopes.push("advanced-a");
  }

  for (const scope of scopes) {
    const starterResult = spawnSync(
      process.platform === "win32" ? "pnpm.cmd" : "pnpm",
      ["verify:week07:starter", `--scope=${scope}`],
      {
        cwd: root,
        env: process.env,
        stdio: "inherit",
      },
    );

    if (starterResult.error) {
      return infraError(
        `starter verifier를 실행할 수 없습니다: ${starterResult.error.message}`,
      );
    }

    if (starterResult.status !== 0) {
      return infraError(
        `${scope} starter가 종료 코드 ${starterResult.status}로 실패했습니다.`,
      );
    }
  }

  const evidencePath = resolve(root, "docs/assignments/week-07-evidence.md");
  let evidence;

  try {
    evidence = await readFile(evidencePath, "utf8");
  } catch {
    return incomplete(
      "학습자 구현과 docs/assignments/week-07-evidence.md 원본 증거가 아직 없습니다.",
    );
  }

  const fields = parseEvidence(evidence);
  const requiredFields =
    selectedAdvanced === "a"
      ? [...basicRequiredFields, ...advancedARequiredFields]
      : basicRequiredFields;
  const incompleteFields = requiredFields.filter((field) =>
    isIncompleteValue(fields.get(field)),
  );

  if (fields.get("advanced") !== selectedAdvanced) {
    incompleteFields.unshift(
      `advanced(선택값 ${selectedAdvanced}와 제출값 ${fields.get("advanced") ?? "누락"} 불일치)`,
    );
  }

  if (
    selectedAdvanced === "a" &&
    fields.get("advanced_a_route") !== "/performance-lab/inp?pageSize=24"
  ) {
    incompleteFields.push("advanced_a_route(고정 재현 경로 불일치)");
  }

  if (
    selectedAdvanced === "a" &&
    fields.get("advanced_a_cpu_throttling") !== "4x slowdown"
  ) {
    incompleteFields.push("advanced_a_cpu_throttling(고정 측정 조건 불일치)");
  }

  if (incompleteFields.length > 0) {
    return incomplete(
      `필수 증거 형식이 미완료입니다: ${[...new Set(incompleteFields)].join(", ")}`,
    );
  }

  console.log(
    selectedAdvanced === "a"
      ? "[PASS] Basic 1~5와 Advanced A 제출 증거 형식이 채워졌습니다. 측정 타당성과 최적화 판단은 멘토가 수동 검토합니다."
      : "[PASS] Basic 1~5 제출 증거 형식이 채워졌습니다. 측정 타당성과 최적화 판단은 멘토가 수동 검토합니다.",
  );
  return 0;
}

process.exitCode = await main();
