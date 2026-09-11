// 번들 예산 게이트 — 첫 화면에서 실제로 내려가는 JS가 예산을 넘는지 본다.
//
//   node scripts/check-bundle-budget.mts            # 검사 (초과 시 exit 1)
//   node scripts/check-bundle-budget.mts --report   # 숫자만 출력하고 항상 exit 0
//
// size-limit을 쓰지 않은 이유: Next의 청크 파일명은 빌드마다 해시가 바뀌어서 glob으로
// "초기 로드"만 골라낼 수 없다. 무엇이 초기 로드인지는 .next/build-manifest.json의
// rootMainFiles + polyfillFiles가 정의하므로, 그 목록을 읽어서 재는 쪽이 정확하다.
//
// 압축은 gzip level 9로 통일한다. 실제 CDN은 brotli를 쓰는 경우가 많아 이 값은 보수적이다.
// 예산을 이 기준으로 정했으니 기준을 바꾸면 예산도 다시 잡아야 한다.

import { gzipSync } from 'node:zlib';
import { appendFileSync, readFileSync } from 'node:fs';
import path from 'node:path';

// 7주차 스로틀 모델(1474.56Kbps = 184.32KB/s)로 바이트를 시간으로 환산한다.
const THROTTLED_KB_PER_SEC = 1474.56 / 8;

// 예산. 측정 시점의 실측값에 여유 10%를 얹은 값이다. 근거는 docs/rfc/week10-ci.md.
const BUDGET_KB = 185;

type BuildManifest = {
  rootMainFiles: string[];
  polyfillFiles: string[];
};

function isBuildManifest(value: unknown): value is BuildManifest {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    Array.isArray(record.rootMainFiles) && Array.isArray(record.polyfillFiles)
  );
}

function readManifest(): BuildManifest {
  const manifestPath = path.join(process.cwd(), '.next/build-manifest.json');
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    throw new Error(
      `.next/build-manifest.json을 읽을 수 없다. 먼저 \`pnpm build\`를 돌려야 한다.`,
    );
  }
  if (!isBuildManifest(parsed)) {
    throw new Error(
      'build-manifest.json에 rootMainFiles/polyfillFiles가 없다. Next 버전이 바뀌었는지 확인할 것.',
    );
  }
  return parsed;
}

function gzipKb(files: string[]): number {
  const total = files.reduce((sum, file) => {
    const buffer = readFileSync(path.join(process.cwd(), '.next', file));
    return sum + gzipSync(buffer, { level: 9 }).byteLength;
  }, 0);
  return total / 1024;
}

function format(kb: number): string {
  return `${kb.toFixed(1)}KB`;
}

function main(): number {
  const reportOnly = process.argv.includes('--report');
  const manifest = readManifest();

  const shellKb = gzipKb(manifest.rootMainFiles);
  const polyfillKb = gzipKb(manifest.polyfillFiles);
  const totalKb = shellKb + polyfillKb;
  const overBy = totalKb - BUDGET_KB;
  const seconds = totalKb / THROTTLED_KB_PER_SEC;

  const rows = [
    `| 항목 | gzip | 예산 |`,
    `| --- | --- | --- |`,
    `| 앱 셸 공용 (${manifest.rootMainFiles.length}개) | ${format(shellKb)} | |`,
    `| polyfill (${manifest.polyfillFiles.length}개) | ${format(polyfillKb)} | |`,
    `| **초기 로드 합계** | **${format(totalKb)}** | ${format(BUDGET_KB)} |`,
  ];

  const verdict =
    overBy > 0
      ? `❌ 예산 초과 — ${format(overBy)} 넘었다 (${format(totalKb)} > ${format(BUDGET_KB)})`
      : `✅ 예산 안 — 여유 ${format(-overBy)} (${format(totalKb)} / ${format(BUDGET_KB)})`;

  const throttle = `7주차 스로틀 모델(1474.56Kbps)에서 이 JS의 전송만 ${seconds.toFixed(2)}초.`;

  const summary = [`### 번들 예산`, '', verdict, '', ...rows, '', throttle, ''];
  process.stdout.write(summary.join('\n') + '\n');

  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath !== undefined && summaryPath !== '') {
    appendFileSync(summaryPath, summary.join('\n') + '\n');
  }

  return reportOnly || overBy <= 0 ? 0 : 1;
}

process.exitCode = main();
