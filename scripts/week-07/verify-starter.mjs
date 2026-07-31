import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { scheduler } from "node:timers/promises";

const root = process.cwd();
const assignmentBase = "8708cb2d7e0f8da0ac98fe0153a750aeee7b69dc";
const assignmentBranch = "codex/week-07-performance-assignment";
const requestedScope = process.argv
  .find((argument) => argument.startsWith("--scope="))
  ?.slice("--scope=".length);

function fail(message) {
  console.error(`[INFRA_ERROR] ${message}`);
  process.exitCode = 1;
}

async function verifyDocument() {
  const documentPath = resolve(root, "docs/assignments/week-07.md");
  const verificationMapPath = resolve(
    root,
    "docs/assignments/week-07-verification-map.md",
  );
  let document;
  let verificationMap;

  try {
    document = await readFile(documentPath, "utf8");
  } catch {
    fail("docs/assignments/week-07.md를 읽을 수 없습니다.");
    return;
  }

  try {
    verificationMap = await readFile(verificationMapPath, "utf8");
  } catch {
    fail(
      "docs/assignments/week-07-verification-map.md를 읽을 수 없습니다.",
    );
    return;
  }

  const requiredFragments = [
    "# 7주차 — 프론트엔드 성능 최적화",
    "source_sha256: 39e307e915f0ebcb787cac091f54cee4b1f5fc2710d96d8b17080d43fd954cce",
    "source_line_count: 458",
    "base_revision: 8708cb2d7e0f8da0ac98fe0153a750aeee7b69dc",
    "assignment_branch: codex/week-07-performance-assignment",
    "## Basic 1단계",
    "## Basic 2단계",
    "## Basic 3단계",
    "## Basic 4단계",
    "## Basic 5단계",
    "## Advanced A",
    "## 검증 계층과 완료 상태",
    "## Week 7 requirement-to-starter verification map",
    "`PASS`",
    "`INCOMPLETE`",
    "`INFRA_ERROR`",
    "`W7-B1`",
    "`W7-B2`",
    "`W7-B3`",
    "`W7-B4`",
    "`W7-B5`",
    "`W7-AA`",
    "starter 제공물",
    "학습자 소유 작업",
    "필수 증거",
    "자동 검증",
    "멘토 수동 검토",
    "인정하지 않는 우회",
    "1.5초 뒤 성공 응답",
    "Lighthouse를 5회",
    "문서에 없는 Lighthouse·INP 절대 점수나 향상률은 합격 기준이 아니에요.",
    "Basic 평가에 영향을 주지 않아요.",
    "production build와 위 세 재현 경로를 검증한 starter commit 또는 tag",
    "`pageSize`를 24보다 작게 바꾸지 않아요.",
    "`4x slowdown`",
    "Before와 After에서 각각 3회",
    "`pnpm verify:week07:submission --advanced=none`",
    "`pnpm verify:week07:submission --advanced=a`",
    "fixture, checkpoint, evidence template, 검증 하네스를 수정해 통과시켜요.",
  ];

  const missingFragments = requiredFragments.filter(
    (fragment) => !document.includes(fragment),
  );

  if (missingFragments.length > 0) {
    fail(`문서 계약 누락: ${missingFragments.join(", ")}`);
    return;
  }

  const excludedPatterns = [
    /Advanced\s+B/i,
    /A와\s+B/,
    /A\s*또는\s*B/,
    new RegExp(`cache${"Components"}`, "i"),
    new RegExp(["performance-lab", "cache"].join("/"), "i"),
    new RegExp(["measurement", "RunId"].join(""), "i"),
    new RegExp(["revalidate", "Tag"].join("")),
    new RegExp(["update", "Tag"].join("")),
    new RegExp(["data", "Version"].join("")),
    /서버\s*캐시/,
    /Redis/,
    /CDN/,
    /Kubernetes/,
  ];
  const matchedExcludedPattern = excludedPatterns.find(
    (pattern) => pattern.test(document) || pattern.test(verificationMap),
  );

  if (matchedExcludedPattern) {
    fail(`제외된 선택 과제 참조가 남아 있습니다: ${matchedExcludedPattern}`);
    return;
  }

  const mapRows = document
    .split("\n")
    .filter((line) => /^\| `W7-(?:B[1-5]|AA)` \|/.test(line));
  const artifactMapRows = verificationMap
    .split("\n")
    .filter((line) => /^\| `W7-(?:B[1-5]|AA)` \|/.test(line));
  const mappedIds = mapRows.map((line) => line.split("|")[1].trim().slice(1, -1));
  const expectedIds = ["W7-B1", "W7-B2", "W7-B3", "W7-B4", "W7-B5", "W7-AA"];

  if (
    mappedIds.length !== expectedIds.length ||
    mappedIds.some((id, index) => id !== expectedIds[index])
  ) {
    fail(`검증 맵 ID가 1:1로 일치하지 않습니다: ${mappedIds.join(", ")}`);
    return;
  }

  const incompleteMapRow = mapRows.find((line) => {
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    return cells.length !== 8 || cells.some((cell) => cell.length === 0);
  });

  if (incompleteMapRow) {
    fail(`검증 맵의 8개 열이 모두 채워져야 합니다: ${incompleteMapRow}`);
    return;
  }

  if (
    artifactMapRows.length !== mapRows.length ||
    artifactMapRows.some((row, index) => row !== mapRows[index])
  ) {
    fail("독립 검증 맵 아티팩트가 과제 문서의 1:1 검증 맵과 다릅니다.");
    return;
  }

  console.log("[PASS] Week 7 문서와 requirement-to-starter 검증 맵");
}

async function verifyBasicInfrastructure() {
  const documentPath = resolve(root, "docs/assignments/week-07.md");
  let document;

  try {
    document = await readFile(documentPath, "utf8");
  } catch {
    fail("누적 브랜치 동기화 안내를 확인할 수 없습니다.");
    return;
  }

  const requiredGuidance = [
    "`/api/home?scenario=slow`와 `/api/products?scenario=slow`는 1.5초 뒤 성공 응답을 반환해요.",
    "응답 데이터는 매번 같은 사용자 경로를 비교할 수 있는 결정적 fixture예요.",
    "기존 홈·상품 목록·검색·카테고리·정렬·페이지네이션·장바구니·위시리스트, FSD, TanStack Query, Zustand 코드를 교체하지 않아요.",
    "API·fixture·측정 장치와 checkpoint만 통합해요.",
  ];
  const missingGuidance = requiredGuidance.filter(
    (fragment) => !document.includes(fragment),
  );

  if (missingGuidance.length > 0) {
    fail(`Basic starter 동기화 안내 누락: ${missingGuidance.join(", ")}`);
    return;
  }

  const testFiles = [
    "src/app/api/_data/commerce.test.ts",
    "src/app/api/home/route.test.ts",
    "src/app/api/products/route.test.ts",
  ];
  const testResult = spawnSync(
    process.platform === "win32" ? "pnpm.cmd" : "pnpm",
    ["exec", "vitest", "run", ...testFiles],
    {
      cwd: root,
      env: process.env,
      stdio: "inherit",
    },
  );

  if (testResult.error) {
    fail(`Basic starter 테스트를 실행할 수 없습니다: ${testResult.error.message}`);
    return;
  }

  if (testResult.status !== 0) {
    fail(`Basic starter 테스트가 종료 코드 ${testResult.status}로 실패했습니다.`);
    return;
  }

  console.log(
    "[PASS] Basic infrastructure: 1500ms slow-path contract, existing scenarios, server-only data access, deterministic fixtures, cumulative sync guidance",
  );
}

async function verifyBasicCheckpoints() {
  const artifactPaths = [
    "docs/assignments/week-07.md",
    "docs/assignments/week-07-verification-map.md",
    "docs/assignments/week-07-evidence-template.md",
  ];
  let document;
  let verificationMap;
  let evidenceTemplate;

  try {
    [document, verificationMap, evidenceTemplate] = await Promise.all(
      artifactPaths.map((artifact) =>
        readFile(resolve(root, artifact), "utf8"),
      ),
    );
  } catch (error) {
    fail(`Basic checkpoint 아티팩트를 읽을 수 없습니다: ${error.message}`);
    return;
  }

  const basicIds = ["W7-B1", "W7-B2", "W7-B3", "W7-B4", "W7-B5"];
  const missingMapIds = basicIds.filter(
    (id) =>
      !document.includes(`| \`${id}\` |`) ||
      !verificationMap.includes(`| \`${id}\` |`),
  );
  const requiredSections = [
    "## Basic 1",
    "## Basic 2",
    "## Basic 3",
    "## Basic 4",
    "## Basic 5",
    "## 멘토 수동 검토 체크리스트",
  ];
  const requiredFields = [
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
  const missingSections = requiredSections.filter(
    (section) => !evidenceTemplate.includes(section),
  );
  const missingFields = requiredFields.filter(
    (field) => !evidenceTemplate.includes(`${field}:`),
  );
  const manualReviewFragments = [
    "Before와 After가 같은 production build 조건",
    "Lighthouse 5회 원값과 중앙값·최솟값·최댓값",
    "filmstrip·waterfall·Layout Shifts·초기 HTML 원본",
    "관찰·가설·반증·가장 작은 변경",
    "조건부 최적화의 적용 증거 또는 무개입 근거",
    "변화가 없거나 악화된 결과",
    "기능·URL·상태·FSD 회귀 결과",
  ];
  const missingManualReview = manualReviewFragments.filter(
    (fragment) => !evidenceTemplate.includes(fragment),
  );

  if (missingMapIds.length > 0) {
    fail(`Basic checkpoint 검증 맵 누락: ${missingMapIds.join(", ")}`);
    return;
  }

  if (missingSections.length > 0 || missingFields.length > 0) {
    fail(
      `Basic evidence template 누락: ${[
        ...missingSections,
        ...missingFields,
      ].join(", ")}`,
    );
    return;
  }

  if (missingManualReview.length > 0) {
    fail(`멘토 수동 검토 계약 누락: ${missingManualReview.join(", ")}`);
    return;
  }

  if ((evidenceTemplate.match(/<필수/g) ?? []).length < 40) {
    fail("evidence template가 학습자 증거를 미리 채우지 않은 placeholder 상태가 아닙니다.");
    return;
  }

  console.log(
    "[PASS] Basic checkpoints: W7-B1~W7-B5, learner evidence template, mentor manual-review contract",
  );
}

function runGit(args) {
  const result = spawnSync("git", args, {
    cwd: root,
    encoding: "utf8",
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

function isAllowedWeek7Path(path) {
  return (
    path === "package.json" ||
    /^docs\/assignments\/week-07[^/]*\.md$/.test(path) ||
    path.startsWith("scripts/week-07/") ||
    /^src\/app\/api\/_data\/commerce(?:\..+)?$/.test(path) ||
    /^src\/app\/api\/home\/route(?:\..+)?$/.test(path) ||
    /^src\/app\/api\/products\/route(?:\..+)?$/.test(path) ||
    path === "src/types/commerce.ts" ||
    path.startsWith("src/app/performance-lab/inp/")
  );
}

function isProtectedCourseMaterial(path) {
  return (
    /^docs\/assignments\/week-0[1-6]\.md$/.test(path) ||
    path.startsWith("docs/learning/") ||
    path.startsWith("docs/lectures/") ||
    /week-07-performance-slides\.html$/.test(path) ||
    /week-07.*(?:presentation|script|대본)/i.test(path)
  );
}

async function verifyProtectedFiles({ strictAuthoringScope = true } = {}) {
  const isolationPath = resolve(
    root,
    "docs/assignments/week-07-workspace-isolation.md",
  );
  let isolationContract;

  try {
    isolationContract = await readFile(isolationPath, "utf8");
  } catch {
    fail("Week 7 worktree 격리 계약을 읽을 수 없습니다.");
    return;
  }

  const requiredContractFragments = [
    `base revision: \`${assignmentBase}\``,
    `branch: \`${assignmentBranch}\``,
    "한 번에 하나의 Week 7 과제 설계 브랜치만 사용",
    "commit, push, PR 생성",
    "사용자 결정으로 폐기된 추가 선택 과제와 관련 starter 추가",
  ];
  const missingContractFragments = requiredContractFragments.filter(
    (fragment) => !isolationContract.includes(fragment),
  );

  if (missingContractFragments.length > 0) {
    fail(`worktree 격리 계약 누락: ${missingContractFragments.join(", ")}`);
    return;
  }

  let worktreeRoot;
  let branch;
  let head;

  try {
    const rootResult = runGit(["rev-parse", "--show-toplevel"]);
    const branchResult = runGit(["branch", "--show-current"]);
    const headResult = runGit(["rev-parse", "HEAD"]);

    if (
      rootResult.status !== 0 ||
      branchResult.status !== 0 ||
      headResult.status !== 0
    ) {
      fail("git worktree·branch·HEAD 상태를 확인할 수 없습니다.");
      return;
    }

    worktreeRoot = rootResult.stdout.trim();
    branch = branchResult.stdout.trim();
    head = headResult.stdout.trim();
  } catch (error) {
    fail(`git 상태 확인 실패: ${error.message}`);
    return;
  }

  if (resolve(worktreeRoot) !== resolve(root)) {
    fail(`검증 cwd가 격리 worktree root가 아닙니다: ${worktreeRoot}`);
    return;
  }

  if (strictAuthoringScope && branch !== assignmentBranch) {
    fail(`과제 제작 브랜치가 다릅니다: ${branch || "(detached HEAD)"}`);
    return;
  }

  const baseIsAncestor = runGit([
    "merge-base",
    "--is-ancestor",
    assignmentBase,
    "HEAD",
  ]);
  if (baseIsAncestor.status !== 0) {
    fail(`origin/main 기준 ${assignmentBase}가 현재 HEAD의 조상이 아닙니다.`);
    return;
  }

  const committedDiff = runGit([
    "diff",
    "--name-only",
    `${assignmentBase}...HEAD`,
  ]);
  const workingDiff = runGit([
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
  ]);

  if (committedDiff.status !== 0 || workingDiff.status !== 0) {
    fail("Week 7 변경 경로를 확인할 수 없습니다.");
    return;
  }

  const changedPaths = new Set(
    committedDiff.stdout
      .split("\n")
      .filter(Boolean)
      .concat(
        workingDiff.stdout
          .split("\n")
          .filter(Boolean)
          .flatMap((line) => {
            const path = line.slice(3);
            return path.includes(" -> ") ? path.split(" -> ") : [path];
          }),
      ),
  );
  const disallowedPaths = [...changedPaths].filter((path) =>
    strictAuthoringScope
      ? !isAllowedWeek7Path(path)
      : isProtectedCourseMaterial(path),
  );

  if (disallowedPaths.length > 0) {
    fail(
      strictAuthoringScope
        ? `허용 범위 밖 변경이 있습니다: ${disallowedPaths.join(", ")}`
        : `보호된 기존 자료가 변경됐습니다: ${disallowedPaths.join(", ")}`,
    );
    return;
  }

  console.log(
    `[PASS] Protected files: mode=${
      strictAuthoringScope ? "authoring" : "portable"
    }, worktree=${worktreeRoot}, branch=${branch}, base=${assignmentBase}, head=${head}, checked_changes=${changedPaths.size}`,
  );
}

async function stopServer(server) {
  if (server.exitCode !== null) {
    return;
  }

  server.kill("SIGTERM");
  await Promise.race([
    once(server, "exit"),
    scheduler.wait(5_000).then(() => {
      if (server.exitCode === null) {
        server.kill("SIGKILL");
      }
    }),
  ]);
}

async function verifyAdvancedARuntime() {
  const requiredArtifacts = [
    "src/app/performance-lab/inp/page.tsx",
    "src/app/performance-lab/inp/page-size.ts",
    "src/app/performance-lab/inp/performance-lab.module.css",
    "src/app/performance-lab/inp/_components/advanced-a-product-list.tsx",
    "src/app/performance-lab/inp/_components/advanced-a-product-card.tsx",
    "src/app/performance-lab/inp/_data/advanced-a-products.ts",
    "src/app/performance-lab/inp/_store/favorites-store.ts",
    "src/app/performance-lab/inp/_lib/required-card-calculation.ts",
    ...Array.from(
      { length: 24 },
      (_, index) => `public/images/products/p${index + 1}.jpg`,
    ),
  ];

  try {
    await Promise.all(
      requiredArtifacts.map((artifact) => access(resolve(root, artifact))),
    );
  } catch (error) {
    fail(`Advanced A starter 아티팩트가 없습니다: ${error.message}`);
    return;
  }

  const testFiles = [
    "src/app/performance-lab/inp/_data/advanced-a-products.test.ts",
    "src/app/performance-lab/inp/_store/favorites-store.test.ts",
    "src/app/performance-lab/inp/_lib/required-card-calculation.test.ts",
    "src/app/performance-lab/inp/page-size.test.ts",
    "src/app/performance-lab/inp/_components/advanced-a-product-list.test.tsx",
  ];
  const testResult = spawnSync(
    process.platform === "win32" ? "pnpm.cmd" : "pnpm",
    ["exec", "vitest", "run", ...testFiles],
    {
      cwd: root,
      env: process.env,
      stdio: "inherit",
    },
  );

  if (testResult.error) {
    fail(`Advanced A 테스트를 실행할 수 없습니다: ${testResult.error.message}`);
    return;
  }

  if (testResult.status !== 0) {
    fail(`Advanced A 테스트가 종료 코드 ${testResult.status}로 실패했습니다.`);
    return;
  }

  const buildResult = spawnSync(
    process.platform === "win32" ? "pnpm.cmd" : "pnpm",
    ["build"],
    {
      cwd: root,
      env: process.env,
      stdio: "inherit",
    },
  );

  if (buildResult.error) {
    fail(`production build를 실행할 수 없습니다: ${buildResult.error.message}`);
    return;
  }

  if (buildResult.status !== 0) {
    fail(`production build가 종료 코드 ${buildResult.status}로 실패했습니다.`);
    return;
  }

  let appPathsManifest;

  try {
    appPathsManifest = JSON.parse(
      await readFile(resolve(root, ".next/server/app-paths-manifest.json"), "utf8"),
    );
  } catch {
    fail("production build의 app-paths manifest를 읽을 수 없습니다.");
    return;
  }

  if (!appPathsManifest["/performance-lab/inp/page"]) {
    fail("production build에 /performance-lab/inp route가 없습니다.");
    return;
  }

  const port = Number(process.env.WEEK07_VERIFY_PORT ?? "41739");
  const server = spawn(
    process.platform === "win32" ? "pnpm.cmd" : "pnpm",
    ["exec", "next", "start", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: root,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let serverOutput = "";
  server.stdout.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });

  try {
    let response;

    for (let attempt = 0; attempt < 80; attempt += 1) {
      if (server.exitCode !== null) {
        fail(
          `production server가 조기에 종료됐습니다 (${server.exitCode}): ${serverOutput}`,
        );
        return;
      }

      try {
        response = await fetch(
          `http://127.0.0.1:${port}/performance-lab/inp?pageSize=24`,
        );
        break;
      } catch {
        await scheduler.wait(250);
      }
    }

    if (!response) {
      fail(`production server에 연결할 수 없습니다: ${serverOutput}`);
      return;
    }

    if (!response.ok) {
      fail(`Advanced A route가 HTTP ${response.status}를 반환했습니다.`);
      return;
    }

    const html = await response.text();
    const cardCount = html.match(/data-week07-card-id=/g)?.length ?? 0;
    const favoriteCount = html.match(/aria-pressed="true"/g)?.length ?? 0;
    const requiredFragments = [
      'data-week07-page-size="24"',
      "필수 화면 계산",
      "배송 준비 지수",
      "profiling build",
    ];
    const missingFragments = requiredFragments.filter(
      (fragment) => !html.includes(fragment),
    );

    if (cardCount !== 24) {
      fail(`production route의 카드 수가 24개가 아닙니다: ${cardCount}`);
      return;
    }

    if (favoriteCount !== 3) {
      fail(`production route의 초기 찜 상태가 3개가 아닙니다: ${favoriteCount}`);
      return;
    }

    if (missingFragments.length > 0) {
      fail(`production route 계약 누락: ${missingFragments.join(", ")}`);
      return;
    }
  } finally {
    await stopServer(server);
  }

  console.log(
    "[PASS] Advanced A: production route, 24 cards, fixed favorites, synchronous feedback, required calculation, learner-owned optimization boundary",
  );
}

switch (requestedScope) {
  case undefined:
    await verifyDocument();
    await verifyBasicInfrastructure();
    await verifyBasicCheckpoints();
    await verifyAdvancedARuntime();
    await verifyProtectedFiles({ strictAuthoringScope: false });
    break;
  case "document":
    await verifyDocument();
    break;
  case "basic-infrastructure":
    await verifyBasicInfrastructure();
    break;
  case "basic-checkpoints":
    await verifyBasicCheckpoints();
    break;
  case "advanced-a":
    await verifyAdvancedARuntime();
    break;
  case "protected-files":
    await verifyProtectedFiles();
    break;
  default:
    fail(`지원하지 않는 scope입니다: ${requestedScope}`);
}
