import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import {
  collectRouteJavaScript,
  evaluateBundleBudgets,
  formatBundleSummary,
  parseClientReferenceManifest,
} from './bundle-budget.mjs';

const checkerPath = fileURLToPath(new URL('./bundle-budget.mjs', import.meta.url));

async function createBuildFixture() {
  const buildDirectory = await mkdtemp(join(tmpdir(), 'loopers-bundle-budget-'));
  const chunksDirectory = join(buildDirectory, 'static/chunks');
  const routeDirectory = join(buildDirectory, 'server/app');
  const productsRouteDirectory = join(routeDirectory, 'products');
  await Promise.all([
    mkdir(chunksDirectory, { recursive: true }),
    mkdir(routeDirectory, { recursive: true }),
    mkdir(productsRouteDirectory, { recursive: true }),
  ]);

  const chunks = {
    'static/chunks/polyfill.js': 'polyfill',
    'static/chunks/runtime.js': 'runtime',
    'static/chunks/shared.js': 'shared module',
    'static/chunks/page.js': 'page module',
  };
  await Promise.all(Object.entries(chunks).map(([path, source]) => (
    writeFile(join(buildDirectory, path), source)
  )));
  await writeFile(
    join(buildDirectory, 'build-manifest.json'),
    JSON.stringify({
      polyfillFiles: ['static/chunks/polyfill.js'],
      rootMainFiles: ['static/chunks/runtime.js', 'static/chunks/shared.js'],
    }),
  );
  const clientManifest = {
    entryJSFiles: {
      layout: ['static/chunks/shared.js'],
      page: ['static/chunks/page.js'],
    },
  };
  await writeFile(
    join(routeDirectory, 'page_client-reference-manifest.js'),
    `globalThis.__RSC_MANIFEST["/page"] = ${JSON.stringify(clientManifest)};`,
  );
  await writeFile(
    join(productsRouteDirectory, 'page_client-reference-manifest.js'),
    `globalThis.__RSC_MANIFEST["/products/page"] = ${JSON.stringify(clientManifest)};`,
  );
  return { buildDirectory, chunks };
}

test('parses the JSON assignment from a Next.js client reference manifest', () => {
  assert.deepEqual(
    parseClientReferenceManifest(
      'globalThis.__RSC_MANIFEST = globalThis.__RSC_MANIFEST || {};\n' +
      'globalThis.__RSC_MANIFEST["/page"] = {"entryJSFiles":{"page":[]}};',
    ),
    { entryJSFiles: { page: [] } },
  );
  assert.throws(() => parseClientReferenceManifest('globalThis.value = missing;'));
});

test('sums each unique initial route chunk gzip size exactly once', async () => {
  const fixture = await createBuildFixture();
  try {
    const result = collectRouteJavaScript(fixture.buildDirectory, '/');
    const expected = Object.values(fixture.chunks)
      .reduce((total, source) => total + gzipSync(source).byteLength, 0);
    assert.equal(result.gzipBytes, expected);
    assert.equal(result.files.length, 4);
  } finally {
    await rm(fixture.buildDirectory, { recursive: true, force: true });
  }
});

test('reports normal and exceeded budgets with actual, budget and delta', async () => {
  const fixture = await createBuildFixture();
  try {
    const actual = collectRouteJavaScript(fixture.buildDirectory, '/').gzipBytes;
    const [passing] = evaluateBundleBudgets(fixture.buildDirectory, { '/': actual });
    const [failing] = evaluateBundleBudgets(fixture.buildDirectory, { '/': actual - 1 });
    assert.equal(passing.passed, true);
    assert.equal(passing.deltaBytes, 0);
    assert.equal(failing.passed, false);
    assert.equal(failing.deltaBytes, 1);
    assert.match(formatBundleSummary([failing]), new RegExp(`\\| / \\| ${actual} B \\| ${actual - 1} B \\| \\+1 B \\| fail \\|`));
  } finally {
    await rm(fixture.buildDirectory, { recursive: true, force: true });
  }
});

test('rejects missing, escaping and non-JavaScript chunk paths', async () => {
  const fixture = await createBuildFixture();
  try {
    const manifestPath = join(fixture.buildDirectory, 'build-manifest.json');
    for (const chunk of ['../outside.js', 'static/chunks/styles.css', 'static\\chunks\\page.js']) {
      await writeFile(manifestPath, JSON.stringify({ rootMainFiles: [chunk] }));
      assert.throws(() => collectRouteJavaScript(fixture.buildDirectory, '/'));
    }
    await writeFile(manifestPath, JSON.stringify({ rootMainFiles: ['static/chunks/missing.js'] }));
    assert.throws(() => collectRouteJavaScript(fixture.buildDirectory, '/'));
  } finally {
    await rm(fixture.buildDirectory, { recursive: true, force: true });
  }
});

test('CLI exits with code 1 and writes an isolated summary when a route exceeds its budget', async () => {
  const fixture = await createBuildFixture();
  const summaryPath = join(fixture.buildDirectory, 'summary.md');
  try {
    const noisyChunk = Buffer.alloc(400_000);
    let state = 0x12345678;
    for (let index = 0; index < noisyChunk.length; index += 1) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      noisyChunk[index] = state >>> 24;
    }
    await writeFile(join(fixture.buildDirectory, 'static/chunks/page.js'), noisyChunk);

    const result = spawnSync(
      process.execPath,
      [checkerPath, 'check', fixture.buildDirectory],
      {
        encoding: 'utf8',
        env: { ...process.env, GITHUB_STEP_SUMMARY: summaryPath },
      },
    );

    assert.equal(result.status, 1);
    assert.match(result.stdout, /\| \/ \| .* \| fail \|/);
    assert.match(result.stdout, /\| \/products \| .* \| fail \|/);
    assert.match(readFileSync(summaryPath, 'utf8'), /## JavaScript bundle budgets/);
  } finally {
    await rm(fixture.buildDirectory, { recursive: true, force: true });
  }
});
