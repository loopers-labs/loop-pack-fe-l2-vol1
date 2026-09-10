/**
 * 진입점별 번들 전송량 측정과 예산 판정.
 *
 * 무엇을 재는가: 각 진입점 HTML이 참조하는 `/_next/static/**`의 JS·CSS를
 * `Accept-Encoding: gzip`으로 받아 **응답 본문의 wire byte**를 합산한다.
 * 브라우저가 실제로 내려받는 양과 같은 기준이다.
 *
 * 왜 빌드 산출물을 직접 재지 않는가: 어느 청크가 어느 진입점에 실리는지는
 * app 라우터 + Turbopack 빌드의 manifest만으로는 나오지 않는다. 실제 HTML이
 * 참조하는 목록을 읽는 편이 "주요 진입점의 예산"이라는 정의와 맞는다.
 *
 * 사용법:
 *   node scripts/measure-transfer.mjs            예산 판정 (초과 시 exit 1)
 *   node scripts/measure-transfer.mjs --rounds=3 반복 측정
 *   node scripts/measure-transfer.mjs --json     원시 결과를 JSON으로 출력
 */

import http from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync, appendFileSync } from 'node:fs';

const BUDGET = JSON.parse(readFileSync(new URL('../bundle-budget.json', import.meta.url), 'utf8'));

const HOST = '127.0.0.1';
const PORT = Number(process.env.MEASURE_PORT ?? 3210);
const ORIGIN = `http://${HOST}:${PORT}`;

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const rounds = Number(args.find((a) => a.startsWith('--rounds='))?.split('=')[1] ?? 1);

/** 응답의 wire byte 수와 헤더를 그대로 돌려준다. fetch는 gzip을 자동 해제해 쓸 수 없다. */
function request(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.get(`${ORIGIN}${path}`, { headers }, (res) => {
      let bytes = 0;
      const chunks = [];
      res.on('data', (c) => {
        bytes += c.length;
        chunks.push(c);
      });
      res.on('end', () =>
        resolve({
          status: res.statusCode,
          encoding: res.headers['content-encoding'] ?? null,
          bytes,
          body: Buffer.concat(chunks),
        }),
      );
    });
    req.on('error', reject);
    req.setTimeout(30_000, () => req.destroy(new Error(`timeout: ${path}`)));
  });
}

async function waitForServer() {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      await request('/');
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error('서버가 뜨지 않았다');
}

/** HTML에서 참조된 정적 JS·CSS 경로를 중복 없이 뽑는다. */
function extractAssets(html) {
  const found = html.match(/\/_next\/static\/[^"' >]+?\.(?:js|css)/g) ?? [];
  return [...new Set(found)].sort();
}

async function measureEntry(entry) {
  const page = await request(entry, { 'Accept-Encoding': 'gzip' });
  if (page.status !== 200) throw new Error(`${entry} 응답이 ${page.status}다`);

  const html =
    page.encoding === 'gzip' ? (await import('node:zlib')).gunzipSync(page.body) : page.body;
  const assets = extractAssets(html.toString('utf8'));
  if (assets.length === 0) throw new Error(`${entry}에서 정적 자산을 찾지 못했다`);

  const files = [];
  for (const path of assets) {
    const res = await request(path, { 'Accept-Encoding': 'gzip' });
    if (res.status !== 200) throw new Error(`${path} 응답이 ${res.status}다`);
    // 작은 파일은 서버가 압축하지 않고 그대로 내려준다. 브라우저가 받는 양을 재는 것이
    // 목적이므로 그 경우도 wire byte를 그대로 합산하고, 인코딩만 기록해 둔다.
    files.push({
      path,
      bytes: res.bytes,
      encoding: res.encoding ?? 'identity',
      kind: path.endsWith('.css') ? 'css' : 'js',
    });
  }

  const sum = (kind) => files.filter((f) => f.kind === kind).reduce((a, f) => a + f.bytes, 0);
  const identity = files.filter((f) => f.encoding === 'identity').length;
  return { entry, files, identity, js: sum('js'), css: sum('css'), total: sum('js') + sum('css') };
}

const kb = (bytes) => (bytes / 1024).toFixed(1);

async function main() {
  const server = spawn(
    './node_modules/.bin/next',
    ['start', '--hostname', HOST, '--port', String(PORT)],
    { env: { ...process.env, APP_ORIGIN: ORIGIN }, stdio: 'ignore' },
  );

  let results;
  try {
    await waitForServer();
    results = [];
    for (let round = 1; round <= rounds; round += 1) {
      const perEntry = [];
      for (const entry of BUDGET.entries) perEntry.push(await measureEntry(entry));
      results.push({ round, entries: perEntry });
    }
  } finally {
    server.kill();
  }

  if (asJson) {
    process.stdout.write(`${JSON.stringify({ budget: BUDGET, results }, null, 2)}\n`);
    return;
  }

  // 판정은 마지막 회차 기준. 반복은 흔들림을 보기 위한 것이다.
  const last = results.at(-1).entries;
  const worst = last.reduce((a, b) => (b.total > a.total ? b : a));
  const over = worst.total - BUDGET.budgetBytes;

  const rows = last.map((e) => {
    const diff = e.total - BUDGET.budgetBytes;
    return `| \`${e.entry}\` | ${e.files.length} | ${kb(e.js)}KB | ${kb(e.css)}KB | **${kb(e.total)}KB** | ${kb(BUDGET.budgetBytes)}KB | ${diff > 0 ? `**+${kb(diff)}KB 초과**` : `${kb(-diff)}KB 남음`} |`;
  });

  const table = [
    '| 진입점 | 자산 수 | JS | CSS | 합계 | 예산 | 여유 |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...rows,
  ].join('\n');

  const title = over > 0 ? '### 번들 예산 초과' : '### 번들 예산 통과';
  const detail =
    over > 0
      ? `\n\`${worst.entry}\`가 예산을 **${kb(over)}KB** 넘겼다. 늘어난 자산은 아래 목록에서 확인한다.\n\n` +
        worst.files
          .sort((a, b) => b.bytes - a.bytes)
          .slice(0, 10)
          .map((f) => `- ${kb(f.bytes)}KB \`${f.path}\``)
          .join('\n')
      : '';

  const identityNote = last.some((e) => e.identity > 0)
    ? ' 작은 파일은 서버가 압축하지 않고 내려주며, 그 경우도 받은 그대로 합산한다.'
    : '';
  const summary = `${title}\n\n측정 기준: 진입점 HTML이 참조하는 JS·CSS를 \`Accept-Encoding: gzip\`으로 받아 합산한 전송 byte.${identityNote}\n\n${table}\n${detail}\n`;

  process.stdout.write(summary);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);

  if (over > 0) process.exit(1);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
