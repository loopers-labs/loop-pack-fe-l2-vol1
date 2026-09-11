// 10주차 5단계 — "무의미한 eslint-disable" 지적(CLAUDE.md 코드 리뷰 기준)을
// 결정적 게이트로 승격. eslint-disable(-next-line/-line) 뒤에 " -- 이유"가
// 없으면 실패시킨다. 이유가 진짜 타당한지는 못 가리지만, "이유를 아예 안
// 쓴 채로 룰을 끄는 것"은 기계적으로 막을 수 있다.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const TARGET_DIRS = ['src', 'e2e', 'scripts'];
const FILE_EXTENSIONS = ['.ts', '.tsx'];

// 진짜 eslint-disable 지시어는 항상 주석 시작 바로 뒤에 온다
// (// eslint-disable-next-line ... 또는 /* eslint-disable ... */).
// 앞에 anchor를 걸어야 "이유 없는 eslint-disable을 쓰지 마세요" 같은
// 일반 산문 주석을 지시어로 오인하지 않는다(10주차 코드 리뷰에서 발견).
const DISABLE_PATTERN =
  /(?:\/\/|\/\*)\s*eslint-disable(?:-next-line|-line)?\b/;
const REASON_PATTERN =
  /(?:\/\/|\/\*)\s*eslint-disable(?:-next-line|-line)?\b[^\n]*--\s*\S/;

function collectFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
    } else if (FILE_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

const violations = [];

for (const dir of TARGET_DIRS) {
  let stat;
  try {
    stat = statSync(dir);
  } catch {
    continue;
  }
  if (!stat.isDirectory()) continue;

  for (const file of collectFiles(dir)) {
    const lines = readFileSync(file, 'utf-8').split('\n');
    lines.forEach((line, idx) => {
      if (DISABLE_PATTERN.test(line) && !REASON_PATTERN.test(line)) {
        violations.push(`${file}:${idx + 1}`);
      }
    });
  }
}

if (violations.length > 0) {
  console.error('❌ 이유 없는 eslint-disable 발견:\n');
  for (const v of violations) console.error(`  - ${v}`);
  console.error(
    '\n형식: // eslint-disable-next-line <rule> -- <이유>\n무의미한 eslint-disable은 리뷰 기준(CLAUDE.md)에 어긋납니다.',
  );
  process.exit(1);
}

console.log('✅ eslint-disable 이유 검증 통과');
