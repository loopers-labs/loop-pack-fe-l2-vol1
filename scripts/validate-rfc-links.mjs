/**
 * 추적되는 RFC 문서가 무시된 로컬 문서 디렉터리를 참조하는지 검사한다.
 *
 * 막으려는 것은 경로 이름을 입에 올리는 일이 아니라, 읽는 사람이 열 수 없는 파일을
 * 문서가 가리키는 일이다. 그 디렉터리는 .gitignore 대상이라 저장소를 받은 사람에게는
 * 존재하지 않고, 링크를 따라가면 빈 곳으로 이어진다.
 *
 * 그래서 판정 기준을 두 가지로 좁힌다.
 *   1. Markdown·HTML 링크의 목적지     → 실패
 *   2. 코드가 아닌 본문에 적힌 파일 경로 → 실패
 * 코드블록과 인라인 코드 안의 문자열은 링크가 되지 않으므로 통과시킨다. 규칙 자체를
 * 설명하려면 경로를 적어야 하는데, 그 설명까지 막으면 규칙을 문서로 남길 수 없다.
 *
 * 검사 대상은 Git이 추적하는 docs/rfc 아래 Markdown 파일로 한정한다.
 *
 * 사용법: pnpm validate:docs
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/** 무시된 로컬 문서 디렉터리. 이 접두사로 시작하는 참조를 막는다. */
const FORBIDDEN_PREFIX = ['docs', 'local'].join('/') + '/';

const TARGET_DIR = 'docs/rfc';

/** Git이 추적하는 파일만 본다. 추적되지 않는 파일은 다른 사람에게 전달되지 않는다. */
function listTrackedDocs() {
  const out = execFileSync(
    'git',
    ['ls-files', '--', `${TARGET_DIR}/**/*.md`, `${TARGET_DIR}/*.md`],
    {
      encoding: 'utf8',
    },
  );
  return [...new Set(out.split('\n').filter(Boolean))].sort();
}

/**
 * 코드로 표시된 구간을 같은 길이의 공백으로 바꾼다.
 * 줄 번호와 열 위치를 유지해야 오류 메시지가 원문을 그대로 가리킬 수 있다.
 */
function blankOutCode(lines) {
  const result = [];
  let fenceMarker = null;

  for (const line of lines) {
    const fence = line.match(/^\s*(`{3,}|~{3,})/);

    if (fenceMarker) {
      result.push(' '.repeat(line.length));
      if (fence && fence[1][0] === fenceMarker[0] && fence[1].length >= fenceMarker.length) {
        fenceMarker = null;
      }
      continue;
    }
    if (fence) {
      fenceMarker = fence[1];
      result.push(' '.repeat(line.length));
      continue;
    }

    // 인라인 코드. 여는 백틱 개수와 같은 수의 백틱으로 닫힌 구간만 코드로 본다.
    result.push(line.replace(/(`+)(?:(?!\1)[\s\S])*?\1/g, (span) => ' '.repeat(span.length)));
  }

  return result;
}

/** 한 줄에서 링크 목적지를 뽑는다. 목적지가 아닌 위치의 경로는 별도로 판정한다. */
function findLinkTargets(line) {
  const targets = [];
  const push = (value, kind) => {
    if (value) targets.push({ value: value.trim(), kind });
  };

  // [설명](목적지) 와 ![설명](목적지)
  for (const m of line.matchAll(/!?\[[^\]]*\]\(\s*<?([^)\s>]+)>?[^)]*\)/g)) {
    push(m[1], 'Markdown 링크');
  }
  // [라벨]: 목적지  (참조 정의)
  for (const m of line.matchAll(/^\s*\[[^\]]+\]:\s*<?([^\s>]+)>?/g)) {
    push(m[1], 'Markdown 참조 정의');
  }
  // <목적지>  (자동 링크)
  for (const m of line.matchAll(/<((?:\.{0,2}\/)?[^\s<>]+\.[a-zA-Z0-9]+)>/g)) {
    push(m[1], 'Markdown 자동 링크');
  }
  // href="목적지" / src='목적지'
  for (const m of line.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/g)) {
    push(m[1], 'HTML 링크');
  }
  return targets;
}

function normalize(target) {
  return target.replace(/^\.\//, '').replace(/^\//, '');
}

function inspect(file) {
  const lines = readFileSync(file, 'utf8').split('\n');
  const visible = blankOutCode(lines);
  const failures = [];

  visible.forEach((line, index) => {
    const lineNumber = index + 1;

    for (const { value, kind } of findLinkTargets(line)) {
      if (normalize(value).startsWith(FORBIDDEN_PREFIX)) {
        failures.push({ file, lineNumber, kind, target: value });
      }
    }

    // 링크 형태가 아니어도 본문에 적힌 경로는 파일 참조로 읽힌다.
    const bare = line.match(new RegExp(`${FORBIDDEN_PREFIX}[^\\s)"'\`]*`));
    if (bare && !failures.some((f) => f.lineNumber === lineNumber)) {
      failures.push({ file, lineNumber, kind: '본문 경로 참조', target: bare[0] });
    }
  });

  return failures;
}

const files = listTrackedDocs();
const failures = files.flatMap(inspect);

if (failures.length > 0) {
  const lines = [
    `${TARGET_DIR} 문서가 무시된 로컬 문서 디렉터리를 참조한다. ${failures.length}건.`,
    '',
    ...failures.map((f) => `  ✗ ${f.file}:${f.lineNumber}  ${f.kind}  →  ${f.target}`),
    '',
    '이 경로는 .gitignore 대상이라 저장소를 받은 사람에게는 존재하지 않는다.',
    '고치는 방법:',
    '  - 참조가 필요 없으면 지운다.',
    '  - 내용이 필요하면 해당 문서로 옮겨 적는다.',
    '  - 규칙을 설명하려고 경로를 적는 경우라면 코드블록이나 인라인 코드로 감싼다.',
  ];
  process.stderr.write(`${lines.join('\n')}\n`);
  process.exit(1);
}

process.stdout.write(`RFC 링크 검사: ${files.length}개 문서, 위반 없음\n`);
