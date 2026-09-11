// PR 변경 파일을 문서/런타임으로 분류한다.
// 입력은 dorny/paths-filter의 JSON 출력(ALL_FILES, DOCS_FILES)을 env로 받는다 —
// 셸 본문에 파일 목록을 직접 삽입하지 않기 위한 경계다.
// 조회 실패·목록 누락은 생략 성공이 아니라 판별 실패(exit 1)다.
import { appendFileSync } from 'node:fs';

const fail = (message) => {
  console.error(`::error::변경 판별 실패 — ${message}`);
  process.exit(1);
};

const parseFileList = (name) => {
  const raw = process.env[name];
  if (!raw) return fail(`${name}가 비어 있다.`);

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fail(`${name}가 JSON이 아니다: ${raw.slice(0, 200)}`);
  }
  if (!Array.isArray(parsed) || parsed.some((f) => typeof f !== 'string')) {
    return fail(`${name}가 문자열 배열이 아니다.`);
  }
  return parsed;
};

const allFiles = parseFileList('ALL_FILES');
const docsFiles = process.argv.includes('--local-diff')
  ? allFiles.filter((file) =>
      /^(?:(?:docs|specs)\/.*\.md|README\.md|AGENTS\.md|CLAUDE\.md|CONVENTIONS\.md|LICENSE)$/.test(
        file,
      ),
    )
  : parseFileList('DOCS_FILES');

if (allFiles.length === 0) {
  fail('변경 파일 목록이 0개다 — PR diff 조회가 누락됐다.');
}

// GitHub 파일 API는 최대 3,000개에서 잘린다. PR 메타데이터의 변경 수와 대조해
// 잘린 목록을 "문서 전용"으로 오판하지 않는다.
// paths-filter는 rename 1건을 이전·새 경로 2개로 펼치므로 목록은 변경 수보다
// 길 수 있어도 짧을 수는 없다 — 등호 비교는 정상 rename PR을 차단한다.
const expectedCount = Number(process.env.EXPECTED_CHANGED_FILES);
if (!Number.isInteger(expectedCount) || expectedCount <= 0) {
  fail(
    `EXPECTED_CHANGED_FILES가 올바르지 않다: ${process.env.EXPECTED_CHANGED_FILES}`,
  );
}
if (expectedCount > 3000) {
  fail(
    `PR 변경 수(${expectedCount}개)가 파일 API 상한(3,000개)을 넘는다 — 목록이 잘린다.`,
  );
}
if (allFiles.length < expectedCount) {
  fail(
    `파일 목록(${allFiles.length}개)이 PR 변경 수(${expectedCount}개)보다 적다 — 조회 누락.`,
  );
}

const allSet = new Set(allFiles);
const missingDocs = docsFiles.filter((f) => !allSet.has(f));
if (missingDocs.length > 0) {
  fail(`docs 목록에 전체 목록에 없는 파일이 있다: ${missingDocs.join(', ')}`);
}

const docsSet = new Set(docsFiles);
const runtimeFiles = allFiles.filter((f) => !docsSet.has(f));

const outputPath = process.env.GITHUB_OUTPUT;
if (!outputPath) fail('GITHUB_OUTPUT이 없다.');
appendFileSync(
  outputPath,
  `runtime=${runtimeFiles.length > 0 ? 'true' : 'false'}\n` +
    `runtime_files=${JSON.stringify(runtimeFiles)}\n`,
);

const listItems = (files) =>
  files.length === 0 ? '\n- (없음)' : files.map((f) => `\n- \`${f}\``).join('');
const summary =
  `## 변경 분류 (${allFiles.length}개)\n\n` +
  `### 런타임 관련 (${runtimeFiles.length}개)${listItems(runtimeFiles)}\n\n` +
  `### 문서 전용 (${docsFiles.length}개)${listItems(docsFiles)}\n`;

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}
console.log(summary);
