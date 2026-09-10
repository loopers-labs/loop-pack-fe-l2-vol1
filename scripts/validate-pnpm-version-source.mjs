import { appendFileSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// pnpm 버전의 출처가 package.json 한 곳뿐인지 확인한다.
//
// 워크플로가 version 을 따로 박으면 같은 값이 여러 곳에 생긴다. 올릴 때 한 곳이
// 빠지면 job 마다 다른 pnpm 이 돌고, --frozen-lockfile 처럼 버전에 민감한 동작의
// 결과가 job 별로 갈린다. 그런데 어느 job 도 실패하지 않아서 초록불로 지나간다.

const WORKFLOW_DIR = ".github/workflows";
const PACKAGE_JSON = "package.json";

const PNPM_SETUP_ACTION = "pnpm/action-setup";
// 이 필드가 없으면 action 이 읽을 곳이 없어서 워크플로가 통째로 깨진다.
// 버전을 워크플로에서 빼는 선택이 이 필드에 기대고 있으므로 함께 확인한다.
const PACKAGE_MANAGER_FIELD = "packageManager";
const PNPM_PREFIX = "pnpm@";

// YAML 파서를 새로 들이지 않으려고 step 단위로 잘라 본다. step 은 항상
// `- name:` 또는 `- uses:` 로 시작하므로 그 줄을 경계로 삼는다.
const STEP_START = /^\s*-\s+(name|uses):/;
const VERSION_INPUT = /^\s*version:\s*(\S+)/;

function splitIntoSteps(lines) {
  const steps = [];
  let current = null;

  lines.forEach((text, index) => {
    if (STEP_START.test(text)) {
      current = { lines: [], startLine: index + 1 };
      steps.push(current);
    }

    if (current) current.lines.push({ text, lineNumber: index + 1 });
  });

  return steps;
}

function findVersionPins(workflowName) {
  const lines = readFileSync(join(WORKFLOW_DIR, workflowName), "utf8").split(
    "\n",
  );

  return splitIntoSteps(lines)
    .filter((step) =>
      step.lines.some(({ text }) => text.includes(PNPM_SETUP_ACTION)),
    )
    .flatMap((step) =>
      step.lines
        .filter(({ text }) => VERSION_INPUT.test(text))
        .map(
          ({ text, lineNumber }) =>
            `${WORKFLOW_DIR}/${workflowName}:${lineNumber} — ${PNPM_SETUP_ACTION} 에 ${text.trim()} 이 박혀 있습니다. 이 줄을 지우면 ${PACKAGE_JSON} 의 ${PACKAGE_MANAGER_FIELD} 를 읽습니다.`,
        ),
    );
}

function findMissingPackageManager() {
  const packageManager = JSON.parse(readFileSync(PACKAGE_JSON, "utf8"))[
    PACKAGE_MANAGER_FIELD
  ];

  if (packageManager?.startsWith(PNPM_PREFIX)) return [];

  return [
    `${PACKAGE_JSON} 에 "${PACKAGE_MANAGER_FIELD}": "${PNPM_PREFIX}<버전>" 이 없습니다. 워크플로가 이 값을 읽으므로 없으면 pnpm 설치가 실패합니다.`,
  ];
}

// CI 에서는 실패 원인이 run 요약 화면에도 보여야 한다. 로컬에는 이 환경 변수가
// 없어 조용히 건너뛴다.
function appendToJobSummary(failures) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;

  if (!summaryPath) return;

  appendFileSync(
    summaryPath,
    [
      `## pnpm 버전 출처 검증 실패 (${failures.length}건)`,
      "",
      ...failures.map((failure) => `- ${failure}`),
      "",
    ].join("\n"),
  );
}

const workflowNames = readdirSync(WORKFLOW_DIR).filter((name) =>
  name.endsWith(".yml"),
);

const failures = [
  ...findMissingPackageManager(),
  ...workflowNames.flatMap(findVersionPins),
];

if (failures.length > 0) {
  appendToJobSummary(failures);
  console.error(`\npnpm 버전 출처 검증 실패 (${failures.length}건)\n`);
  failures.forEach((failure) => console.error(`  ${failure}`));
  console.error(
    `\n버전은 ${PACKAGE_JSON} 의 ${PACKAGE_MANAGER_FIELD} 한 곳에만 둡니다.\n`,
  );
  process.exit(1);
}
