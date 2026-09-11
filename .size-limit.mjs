// 번들 예산 대상을 Turbopack 빌드 산출물에서 동적으로 수집한다 — 해시 파일명을 고정하지 않는다.
// 초기 JS = build-manifest의 rootMainFiles + 라우트 client-reference-manifest의
// entryJSFiles 합집합. polyfillFiles는 nomodule 스크립트라 현대 브라우저가 받지 않아 제외한다.
// 이 조합이 실제 브라우저 초기 요청과 일치함은 서빙 HTML 대조로 검증했다
// (docs/rfc/week10-ci.md 3단계 기록). 수집 실패·대상 누락은 예외로 검사 전체를 실패시킨다.
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import { BUDGET_TARGETS } from './scripts/week-10-ci/budget-targets.mjs';

const require = createRequire(import.meta.url);

// BUDGET_ROOT·BUDGET_LIMITS_FILE은 실행 검사의 픽스처 주입 전용이다.
// CI·로컬 게이트는 기본값으로 동작한다.
const root = process.env.BUDGET_ROOT ?? process.cwd();
const nextDir = join(root, '.next');
const limitsFile =
  process.env.BUDGET_LIMITS_FILE ??
  join(root, 'scripts/week-10-ci/budget.json');

const fail = (reason) => {
  throw new Error(`예산 대상 수집 실패 — ${reason}`);
};

const readJson = (path, description) => {
  if (!existsSync(path)) fail(`${description} 없음: ${path}`);
  return JSON.parse(readFileSync(path, 'utf8'));
};

const toExistingPath = (file) => {
  const absolute = join(nextDir, file);
  if (!existsSync(absolute)) fail(`매니페스트가 가리키는 파일 없음: ${file}`);
  return absolute;
};

const buildManifest = readJson(
  join(nextDir, 'build-manifest.json'),
  'build-manifest.json',
);
const baseFiles = buildManifest.rootMainFiles ?? [];
if (baseFiles.length === 0) fail('build-manifest의 rootMainFiles가 비었다');

// 라우트의 초기 클라이언트 JS: 공통 base + 세그먼트 사슬(entryJSFiles)의 합집합.
const routeInitialFiles = (manifestRelPath, routeKey, pageSegmentSuffix) => {
  const manifestPath = join(nextDir, manifestRelPath);
  if (!existsSync(manifestPath))
    fail(`client-reference-manifest 없음: ${manifestRelPath}`);
  // 이 매니페스트는 export가 없고 globalThis.__RSC_MANIFEST에 대입하는 스크립트다
  // — Next 런타임이 읽는 방식 그대로, require의 부작용으로 채워 꺼낸다.
  globalThis.__RSC_MANIFEST ??= {};
  require(manifestPath);
  const manifest = globalThis.__RSC_MANIFEST[routeKey];
  if (!manifest?.entryJSFiles) fail(`${routeKey}의 entryJSFiles 없음`);
  const segmentKeys = Object.keys(manifest.entryJSFiles);
  if (!segmentKeys.some((key) => key.endsWith(pageSegmentSuffix))) {
    fail(`${routeKey}에 page 세그먼트(${pageSegmentSuffix})가 없다`);
  }
  const files = new Set(baseFiles);
  for (const segmentFiles of Object.values(manifest.entryJSFiles)) {
    for (const file of segmentFiles) files.add(file);
  }
  return [...files].map(toExistingPath);
};

const homeFiles = routeInitialFiles(
  'server/app/(commerce)/page_client-reference-manifest.js',
  '/(commerce)/page',
  'src/app/(commerce)/page',
);
const productsFiles = routeInitialFiles(
  'server/app/(commerce)/products/page_client-reference-manifest.js',
  '/(commerce)/products/page',
  'src/app/(commerce)/products/page',
);

const sharedFiles = homeFiles.filter((file) => productsFiles.includes(file));
if (sharedFiles.length === 0) fail('홈∩목록 공유 파일이 0개 — 수집 오류');

const FILES_BY_TARGET = {
  'home-initial-js': homeFiles,
  'products-initial-js': productsFiles,
  'shared-js': sharedFiles,
};

const limits = readJson(limitsFile, '예산 임계값 파일');

// 압축 합산은 file 플러그인 기본(Brotli q11)을 그대로 쓴다.
// 대상 id의 정본은 BUDGET_TARGETS다 — 여기 수집식이나 budget.json이 뒤처지면 실패로 드러난다.
export default BUDGET_TARGETS.map(({ id }) => {
  const files = FILES_BY_TARGET[id];
  if (!files) fail(`수집식 없는 대상: ${id}`);
  const limit = limits[id];
  if (typeof limit !== 'number') {
    fail(`임계값 누락: ${id} — 빈 검사를 통과로 두지 않는다`);
  }
  return { name: id, path: files, limit };
});
