/**
 * 환경 변수 계약 검증.
 *
 * 컷을 나눠 검사한다.
 *   --context=ci          코드만으로 판정 가능한 것. 형식·접두사 오용을 본다.
 *                         CI에는 실제 비밀값이 없으므로 값의 진짜 여부는 묻지 않는다.
 *   --context=production  배포 환경에서만 판정 가능한 것. 값이 실제로 주입됐는지,
 *                         fallback으로 도는지를 본다.
 *
 * build 전에 실행한다. 설정 오류는 코드 검증을 통과한 뒤에 드러나고 실패 영향이 크다.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SCAN_DIRS = ['src', 'e2e', 'test'];

/** 브라우저 번들에 실려서는 안 되는 서버 전용 변수. */
const SERVER_ONLY = ['AUTH_SESSION_SECRET', 'APP_ORIGIN'];

/** 코드에 박혀 있는 fallback. production에서 이 값으로 돌면 설정이 빠진 것이다. */
const FALLBACKS = {
  AUTH_SESSION_SECRET: 'loopers-week09-secret',
  APP_ORIGIN: 'http://localhost:3000',
};

const context =
  process.argv
    .slice(2)
    .find((a) => a.startsWith('--context='))
    ?.split('=')[1] ?? 'ci';
const failures = [];
const notes = [];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx|mjs|js)$/.test(name)) out.push(full);
  }
  return out;
}

/** 서버 전용 값에 NEXT_PUBLIC_ 접두사가 붙으면 브라우저 번들에 실린다. 정적으로 막는다. */
function checkPublicPrefix() {
  const files = SCAN_DIRS.flatMap((d) => {
    try {
      return walk(join(ROOT, d));
    } catch {
      return [];
    }
  });

  for (const file of files) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, index) => {
      // 주석은 건너뛴다. 접두사를 쓰지 않기로 한 경위가 주석으로 남아 있다.
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
      for (const name of SERVER_ONLY) {
        if (line.includes(`NEXT_PUBLIC_${name}`)) {
          failures.push(
            `${relative(ROOT, file)}:${index + 1} 서버 전용 값에 NEXT_PUBLIC_ 접두사가 붙었다: NEXT_PUBLIC_${name}`,
          );
        }
      }
    });
  }
  notes.push(`NEXT_PUBLIC_ 접두사 검사: ${files.length}개 파일`);
}

function checkOriginFormat() {
  const value = process.env.APP_ORIGIN;
  if (value === undefined || value === '') {
    if (context === 'production') failures.push('APP_ORIGIN이 비어 있다');
    else notes.push('APP_ORIGIN 미설정 — ci 맥락에서는 형식만 검사하므로 넘어간다');
    return;
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    failures.push(`APP_ORIGIN이 URL 형식이 아니다: ${value}`);
    return;
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    failures.push(`APP_ORIGIN의 프로토콜이 http/https가 아니다: ${url.protocol}`);
    return;
  }
  if (context === 'production') {
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      failures.push(`APP_ORIGIN이 로컬 주소다: ${value}`);
    }
    if (url.protocol !== 'https:') {
      failures.push(`APP_ORIGIN이 https가 아니다: ${value}`);
    }
  }
  notes.push(`APP_ORIGIN 형식 확인: ${value}`);
}

function checkSessionSecret() {
  const value = process.env.AUTH_SESSION_SECRET;
  if (value === undefined || value === '') {
    if (context === 'production') failures.push('AUTH_SESSION_SECRET이 비어 있다');
    else failures.push('AUTH_SESSION_SECRET이 비어 있다 — ci에서도 검증용 값을 주입해야 한다');
    return;
  }
  if (context === 'production' && value === FALLBACKS.AUTH_SESSION_SECRET) {
    failures.push('AUTH_SESSION_SECRET이 코드의 fallback 값 그대로다');
  }
  notes.push(`AUTH_SESSION_SECRET 확인: ${value.length}자 (값은 출력하지 않는다)`);
}

if (!['ci', 'production'].includes(context)) {
  process.stderr.write(`알 수 없는 context: ${context}\n`);
  process.exit(1);
}

checkPublicPrefix();
checkOriginFormat();
checkSessionSecret();

const lines = [`환경 변수 검증 (context=${context})`, ...notes.map((n) => `  - ${n}`)];
if (failures.length > 0) {
  lines.push('', '실패:', ...failures.map((f) => `  ✗ ${f}`));
  process.stderr.write(`${lines.join('\n')}\n`);
  process.exit(1);
}
lines.push('  - 통과');
process.stdout.write(`${lines.join('\n')}\n`);
