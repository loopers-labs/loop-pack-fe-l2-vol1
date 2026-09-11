import { appendFileSync, readFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

export const BUNDLE_BUDGETS = Object.freeze({
  '/': 280 * 1024,
  '/products': 286 * 1024,
});

const ROUTE_MANIFESTS = Object.freeze({
  '/': 'server/app/page_client-reference-manifest.js',
  '/products': 'server/app/products/page_client-reference-manifest.js',
});

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function parseClientReferenceManifest(source) {
  const manifestAssignment = source.lastIndexOf('globalThis.__RSC_MANIFEST[');
  const assignment = source.indexOf('=', Math.max(0, manifestAssignment));
  const start = source.indexOf('{', assignment);
  const end = source.lastIndexOf('}');
  if (assignment < 0 || start < 0 || end < start) {
    throw new Error('Client reference manifest does not contain a JSON assignment');
  }
  return JSON.parse(source.slice(start, end + 1));
}

function assertChunkPath(chunk) {
  if (
    typeof chunk !== 'string' ||
    isAbsolute(chunk) ||
    chunk.includes('\\') ||
    !chunk.startsWith('static/chunks/') ||
    !chunk.endsWith('.js')
  ) {
    throw new Error(`Unexpected JavaScript chunk path: ${String(chunk)}`);
  }
  const segments = chunk.split('/');
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    throw new Error(`Unexpected JavaScript chunk path: ${chunk}`);
  }
}

function resolveInsideBuild(buildDirectory, chunk) {
  assertChunkPath(chunk);
  const buildRoot = resolve(buildDirectory);
  const chunkPath = resolve(buildRoot, chunk);
  const pathFromBuild = relative(buildRoot, chunkPath);
  if (pathFromBuild.startsWith('..') || isAbsolute(pathFromBuild)) {
    throw new Error(`JavaScript chunk escapes the build directory: ${chunk}`);
  }
  return chunkPath;
}

export function collectRouteJavaScript(buildDirectory, route) {
  const routeManifest = ROUTE_MANIFESTS[route];
  if (!routeManifest) throw new Error(`Unsupported budget route: ${route}`);

  const buildManifest = readJson(join(buildDirectory, 'build-manifest.json'));
  const clientManifest = parseClientReferenceManifest(
    readFileSync(join(buildDirectory, routeManifest), 'utf8'),
  );
  const entryFiles = Object.values(clientManifest.entryJSFiles ?? {}).flat();
  const chunks = [...new Set([
    ...(buildManifest.polyfillFiles ?? []),
    ...(buildManifest.rootMainFiles ?? []),
    ...entryFiles,
  ])].sort();

  if (chunks.length === 0) throw new Error(`No initial JavaScript chunks found for ${route}`);

  const files = chunks.map((chunk) => {
    const source = readFileSync(resolveInsideBuild(buildDirectory, chunk));
    return { chunk, gzipBytes: gzipSync(source).byteLength };
  });
  return {
    route,
    gzipBytes: files.reduce((total, file) => total + file.gzipBytes, 0),
    files,
  };
}

export function evaluateBundleBudgets(buildDirectory, budgets = BUNDLE_BUDGETS) {
  return Object.entries(budgets).map(([route, budgetBytes]) => {
    if (!Number.isSafeInteger(budgetBytes) || budgetBytes < 0) {
      throw new Error(`Bundle budget for ${route} must be a non-negative integer`);
    }
    const measurement = collectRouteJavaScript(buildDirectory, route);
    const deltaBytes = measurement.gzipBytes - budgetBytes;
    return {
      ...measurement,
      budgetBytes,
      deltaBytes,
      passed: deltaBytes <= 0,
    };
  });
}

export function formatBundleSummary(results) {
  const rows = results.map(({ route, gzipBytes, budgetBytes, deltaBytes, passed }) => {
    const delta = deltaBytes > 0 ? `+${deltaBytes}` : String(deltaBytes);
    return `| ${route} | ${gzipBytes} B | ${budgetBytes} B | ${delta} B | ${passed ? 'pass' : 'fail'} |`;
  });
  return [
    '## JavaScript bundle budgets',
    '',
    'Metric: sum of each route\'s unique initial JavaScript chunks, compressed separately with gzip.',
    '',
    '| Route | Actual | Budget | Delta | Result |',
    '| --- | ---: | ---: | ---: | --- |',
    ...rows,
    '',
  ].join('\n');
}

export function formatBundleMeasurements(measurements) {
  const rows = measurements.map(({ route, gzipBytes, files }) => (
    `| ${route} | ${gzipBytes} B | ${files.length} |`
  ));
  return [
    '## JavaScript bundle measurements',
    '',
    'Metric: sum of each route\'s unique initial JavaScript chunks, compressed separately with gzip.',
    '',
    '| Route | Actual | Chunks |',
    '| --- | ---: | ---: |',
    ...rows,
    '',
  ].join('\n');
}

function run() {
  const mode = process.argv[2] ?? 'check';
  const buildDirectory = resolve(process.argv[3] ?? '.next');
  if (!['check', 'measure'].includes(mode)) {
    throw new Error('Usage: bundle-budget.mjs [check|measure] [build-directory]');
  }
  if (mode === 'measure') {
    const measurements = Object.keys(BUNDLE_BUDGETS)
      .map((route) => collectRouteJavaScript(buildDirectory, route));
    process.stdout.write(formatBundleMeasurements(measurements));
    return;
  }
  const results = evaluateBundleBudgets(buildDirectory);
  const summary = formatBundleSummary(results);
  process.stdout.write(summary);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
  }
  if (results.some((result) => !result.passed)) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Bundle budget check failed: ${message}`);
    if (process.env.GITHUB_STEP_SUMMARY) {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## JavaScript bundle budgets\n\nCheck failed: ${message}\n`);
    }
    process.exitCode = 1;
  }
}
