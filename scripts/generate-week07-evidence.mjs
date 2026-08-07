import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const evidenceRoot = path.join(repoRoot, 'docs', 'user', 'week-07-evidence');

const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(evidenceRoot, relativePath), 'utf8'));

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

const round = (value) => Math.round(value);
const formatMs = (value) => `${round(value).toLocaleString('en-US')} ms`;
const formatBytes = (value) =>
  value >= 1024 * 1024
    ? `${(value / 1024 / 1024).toFixed(2)} MiB`
    : `${(value / 1024).toFixed(1)} KiB`;

const escapeXml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const dataUrlBuffer = (dataUrl) =>
  Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');

function collectSimulated(side) {
  const directory = path.join(evidenceRoot, side, 'simulated');
  const runs = fs
    .readdirSync(directory)
    .filter((filename) => filename.endsWith('.report.json'))
    .sort()
    .map((filename) => {
      const report = JSON.parse(fs.readFileSync(path.join(directory, filename), 'utf8'));
      const audits = report.audits;
      return {
        run: filename.replace('.report.json', ''),
        file: path.posix.join(side, 'simulated', filename),
        score: round(report.categories.performance.score * 100),
        fcp: round(audits['first-contentful-paint'].numericValue),
        lcp: round(audits['largest-contentful-paint'].numericValue),
        cls: Number(audits['cumulative-layout-shift'].numericValue.toFixed(6)),
        warnings: report.runWarnings ?? [],
        fetchTime: report.fetchTime,
      };
    });

  const summarize = (key) => {
    const values = runs.map((run) => run[key]);
    return {
      median: median(values),
      min: Math.min(...values),
      max: Math.max(...values),
    };
  };

  const lcpMedian = summarize('lcp').median;
  const representative = runs.reduce((closest, run) =>
    Math.abs(run.lcp - lcpMedian) < Math.abs(closest.lcp - lcpMedian) ? run : closest,
  );

  return {
    runs,
    summary: {
      score: summarize('score'),
      fcp: summarize('fcp'),
      lcp: summarize('lcp'),
      cls: summarize('cls'),
    },
    representative,
  };
}

function collectApplied(side) {
  const relativePath = path.posix.join(side, 'applied', 'run-01.report.json');
  const report = readJson(relativePath);
  const audits = report.audits;
  const element =
    audits['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.snippet ?? '';
  const src = element.match(/src="([^"]+)"/)?.[1] ?? '';
  const requests = audits['network-requests']?.details?.items ?? [];
  const lcpRequest = requests.find((request) =>
    src.startsWith('http') ? request.url === src : request.url.endsWith(src),
  );

  return {
    file: relativePath,
    report,
    score: round(report.categories.performance.score * 100),
    fcp: round(audits['first-contentful-paint'].numericValue),
    lcp: round(audits['largest-contentful-paint'].numericValue),
    cls: Number(audits['cumulative-layout-shift'].numericValue.toFixed(6)),
    element,
    phases: audits['lcp-breakdown-insight']?.details?.items?.[0]?.items ?? [],
    request: lcpRequest
      ? {
          url: lcpRequest.url,
          resourceSize: lcpRequest.resourceSize,
          transferSize: lcpRequest.transferSize,
          startTime: lcpRequest.networkRequestTime,
          endTime: lcpRequest.networkEndTime,
          priority: lcpRequest.priority,
        }
      : null,
    heroRequests: requests
      .filter((request) => /hero-(original|640|1080|1920)/.test(request.url))
      .map((request) => ({
        url: request.url,
        resourceSize: request.resourceSize,
        transferSize: request.transferSize,
        startTime: request.networkRequestTime,
        endTime: request.networkEndTime,
        priority: request.priority,
      })),
    screenshots: audits['screenshot-thumbnails']?.details?.items ?? [],
    finalScreenshot: audits['final-screenshot']?.details?.data ?? null,
    warnings: report.runWarnings ?? [],
  };
}

async function writeMetricsBoard(summary) {
  const before = summary.before.summary;
  const after = summary.after.summary;
  const appliedBefore = summary.applied.before;
  const appliedAfter = summary.applied.after;
  const width = 1400;
  const height = 860;
  const rows = [
    ['Performance score', before.score.median, after.score.median, '점'],
    ['FCP median', before.fcp.median, after.fcp.median, 'ms'],
    ['LCP median', before.lcp.median, after.lcp.median, 'ms'],
    ['CLS median', before.cls.median, after.cls.median, ''],
  ];

  const rowSvg = rows
    .map(([label, beforeValue, afterValue, unit], index) => {
      const y = 275 + index * 92;
      const beforeText = unit === 'ms' ? formatMs(beforeValue) : `${beforeValue}${unit ? ` ${unit}` : ''}`;
      const afterText = unit === 'ms' ? formatMs(afterValue) : `${afterValue}${unit ? ` ${unit}` : ''}`;
      return `<text x="90" y="${y}" class="label">${escapeXml(label)}</text>
        <text x="670" y="${y}" text-anchor="end" class="before">${escapeXml(beforeText)}</text>
        <text x="1310" y="${y}" text-anchor="end" class="after">${escapeXml(afterText)}</text>`;
    })
    .join('\n');

  const appliedChange = round(((appliedAfter.lcp - appliedBefore.lcp) / appliedBefore.lcp) * 100);
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .title{font:700 46px 'Segoe UI','Malgun Gothic',sans-serif;fill:#171717}
      .sub{font:400 23px 'Segoe UI','Malgun Gothic',sans-serif;fill:#666}
      .head{font:700 27px 'Segoe UI','Malgun Gothic',sans-serif}
      .label{font:600 27px 'Segoe UI','Malgun Gothic',sans-serif;fill:#333}
      .before{font:700 29px 'Segoe UI','Malgun Gothic',sans-serif;fill:#b64747}
      .after{font:700 29px 'Segoe UI','Malgun Gothic',sans-serif;fill:#237a57}
      .note{font:500 24px 'Segoe UI','Malgun Gothic',sans-serif;fill:#333}
    </style>
    <rect width="100%" height="100%" fill="#fbfaf7"/>
    <text x="70" y="80" class="title">Week 07 Lighthouse Before / After</text>
    <text x="70" y="125" class="sub">Mobile 412×823 · CPU 4x · Lighthouse 12.8.2 · 5 simulated runs</text>
    <rect x="60" y="165" width="1280" height="470" rx="24" fill="#fff" stroke="#ddd8cf"/>
    <text x="670" y="220" text-anchor="end" class="head" fill="#b64747">BEFORE</text>
    <text x="1310" y="220" text-anchor="end" class="head" fill="#237a57">AFTER</text>
    ${rowSvg}
    <rect x="60" y="670" width="1280" height="130" rx="24" fill="#f2eee5"/>
    <text x="90" y="720" class="note">Applied Slow 4G LCP</text>
    <text x="90" y="765" class="note">${formatMs(appliedBefore.lcp)} → ${formatMs(appliedAfter.lcp)} (${appliedChange}%)</text>
    <text x="1310" y="745" text-anchor="end" class="sub">simulated와 applied 결과는 분리 해석</text>
  </svg>`;

  await sharp(Buffer.from(svg)).png().toFile(path.join(evidenceRoot, 'compare', 'lighthouse-metrics.png'));
}

async function writeBreakdownBoard(summary) {
  const before = summary.applied.before;
  const after = summary.applied.after;
  const labels = ['timeToFirstByte', 'resourceLoadDelay', 'resourceLoadDuration', 'elementRenderDelay'];
  const names = ['TTFB', 'Resource load delay', 'Resource load duration', 'Element render delay'];
  const beforeValues = Object.fromEntries(before.phases.map((phase) => [phase.subpart, phase.duration]));
  const afterValues = Object.fromEntries(after.phases.map((phase) => [phase.subpart, phase.duration]));
  const max = Math.max(...Object.values(beforeValues), ...Object.values(afterValues));
  const width = 1500;
  const height = 760;
  const maxBar = 880;
  const rows = labels
    .map((key, index) => {
      const y = 210 + index * 125;
      const beforeWidth = Math.max(2, (beforeValues[key] / max) * maxBar);
      const afterWidth = Math.max(2, (afterValues[key] / max) * maxBar);
      return `<text x="70" y="${y}" class="label">${names[index]}</text>
        <rect x="400" y="${y - 35}" width="${beforeWidth}" height="30" rx="8" fill="#d96c6c"/>
        <text x="1325" y="${y - 10}" class="value" fill="#a13b3b">${formatMs(beforeValues[key])}</text>
        <rect x="400" y="${y + 12}" width="${afterWidth}" height="30" rx="8" fill="#4ba47c"/>
        <text x="1325" y="${y + 37}" class="value" fill="#237a57">${formatMs(afterValues[key])}</text>`;
    })
    .join('\n');

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .title{font:700 44px 'Segoe UI','Malgun Gothic',sans-serif;fill:#171717}
      .sub{font:400 22px 'Segoe UI','Malgun Gothic',sans-serif;fill:#666}
      .label{font:600 23px 'Segoe UI','Malgun Gothic',sans-serif;fill:#333}
      .value{font:700 22px 'Segoe UI','Malgun Gothic',sans-serif}
    </style>
    <rect width="100%" height="100%" fill="#fbfaf7"/>
    <text x="60" y="70" class="title">Applied Slow 4G · LCP breakdown</text>
    <text x="60" y="112" class="sub">BEFORE <tspan fill="#b64747">red</tspan> · AFTER <tspan fill="#237a57">green</tspan> · same scale</text>
    <rect x="40" y="145" width="1420" height="560" rx="24" fill="#fff" stroke="#ddd8cf"/>
    ${rows}
  </svg>`;

  await sharp(Buffer.from(svg)).png().toFile(path.join(evidenceRoot, 'compare', 'lcp-breakdown.png'));
}

async function writeFilmstripBoard(summary) {
  const sides = [
    ['BEFORE', summary.applied.before],
    ['AFTER', summary.applied.after],
  ];
  const thumbWidth = 190;
  const thumbHeight = 380;
  const gap = 16;
  const left = 50;
  const width = left * 2 + sides[0][1].screenshots.length * (thumbWidth + gap) - gap;
  const rowHeight = 500;
  const height = 110 + rowHeight * 2;
  const composites = [];
  const labels = [];

  for (let row = 0; row < sides.length; row += 1) {
    const [label, data] = sides[row];
    const y = 110 + row * rowHeight;
    labels.push(`<text x="${left}" y="${y - 35}" class="row ${row === 0 ? 'before' : 'after'}">${label} · LCP ${formatMs(data.lcp)}</text>`);
    for (let index = 0; index < data.screenshots.length; index += 1) {
      const screenshot = data.screenshots[index];
      const buffer = await sharp(dataUrlBuffer(screenshot.data))
        .resize({ width: thumbWidth, height: thumbHeight, fit: 'contain', background: '#ffffff' })
        .png()
        .toBuffer();
      const x = left + index * (thumbWidth + gap);
      composites.push({ input: buffer, left: x, top: y });
      labels.push(`<text x="${x + thumbWidth / 2}" y="${y + thumbHeight + 30}" text-anchor="middle" class="time">${round(screenshot.timing)} ms</text>`);
    }
  }

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .title{font:700 40px 'Segoe UI','Malgun Gothic',sans-serif;fill:#171717}
      .row{font:700 27px 'Segoe UI','Malgun Gothic',sans-serif}
      .before{fill:#b64747}.after{fill:#237a57}
      .time{font:500 18px 'Segoe UI',sans-serif;fill:#555}
    </style>
    <rect width="100%" height="100%" fill="#f5f2eb"/>
    <text x="${left}" y="55" class="title">Applied Slow 4G · Filmstrip</text>
    ${labels.join('\n')}
  </svg>`;

  await sharp(Buffer.from(svg))
    .composite(composites)
    .png()
    .toFile(path.join(evidenceRoot, 'compare', 'filmstrip-before-after.png'));
}

async function writeFinalScreenshotBoard(summary) {
  const beforeBuffer = await sharp(dataUrlBuffer(summary.applied.before.finalScreenshot))
    .resize({ width: 520, height: 1040, fit: 'contain', background: '#ffffff' })
    .png()
    .toBuffer();
  const afterBuffer = await sharp(dataUrlBuffer(summary.applied.after.finalScreenshot))
    .resize({ width: 520, height: 1040, fit: 'contain', background: '#ffffff' })
    .png()
    .toBuffer();
  const width = 1240;
  const height = 1200;
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .title{font:700 42px 'Segoe UI','Malgun Gothic',sans-serif;fill:#171717}
      .head{font:700 28px 'Segoe UI','Malgun Gothic',sans-serif}
    </style>
    <rect width="100%" height="100%" fill="#f5f2eb"/>
    <text x="50" y="60" class="title">Final viewport · Before / After</text>
    <text x="310" y="110" text-anchor="middle" class="head" fill="#b64747">BEFORE</text>
    <text x="930" y="110" text-anchor="middle" class="head" fill="#237a57">AFTER</text>
  </svg>`;
  await sharp(Buffer.from(svg))
    .composite([
      { input: beforeBuffer, left: 50, top: 135 },
      { input: afterBuffer, left: 670, top: 135 },
    ])
    .png()
    .toFile(path.join(evidenceRoot, 'compare', 'final-viewport-before-after.png'));
}

function writeSummary(summary) {
  const cleanSummary = JSON.parse(JSON.stringify(summary));
  delete cleanSummary.applied.before.report;
  delete cleanSummary.applied.after.report;
  delete cleanSummary.applied.before.screenshots;
  delete cleanSummary.applied.after.screenshots;
  delete cleanSummary.applied.before.finalScreenshot;
  delete cleanSummary.applied.after.finalScreenshot;
  fs.writeFileSync(
    path.join(evidenceRoot, 'summary.json'),
    `${JSON.stringify(cleanSummary, null, 2)}\n`,
  );

  const before = summary.before.summary;
  const after = summary.after.summary;
  const appliedBefore = summary.applied.before;
  const appliedAfter = summary.applied.after;
  const rows = summary.before.runs.map((beforeRun, index) => {
    const afterRun = summary.after.runs[index];
    return `| ${index + 1} | ${beforeRun.fcp} | ${beforeRun.lcp} | ${beforeRun.cls} | ${afterRun.fcp} | ${afterRun.lcp} | ${afterRun.cls} |`;
  });
  const markdown = `# Week 07 Lighthouse measurement summary

## Simulated throttling, 5 runs

| Run | Before FCP | Before LCP | Before CLS | After FCP | After LCP | After CLS |
|---:|---:|---:|---:|---:|---:|---:|
${rows.join('\n')}
| **Median** | **${before.fcp.median}** | **${before.lcp.median}** | **${before.cls.median}** | **${after.fcp.median}** | **${after.lcp.median}** | **${after.cls.median}** |
| Range | ${before.fcp.min}–${before.fcp.max} | ${before.lcp.min}–${before.lcp.max} | ${before.cls.min}–${before.cls.max} | ${after.fcp.min}–${after.fcp.max} | ${after.lcp.min}–${after.lcp.max} | ${after.cls.min}–${after.cls.max} |

## Applied DevTools throttling, representative run

| Metric | Before | After |
|---|---:|---:|
| FCP | ${formatMs(appliedBefore.fcp)} | ${formatMs(appliedAfter.fcp)} |
| LCP | ${formatMs(appliedBefore.lcp)} | ${formatMs(appliedAfter.lcp)} |
| CLS | ${appliedBefore.cls} | ${appliedAfter.cls} |
| LCP resource | ${formatBytes(appliedBefore.request.resourceSize)} | ${formatBytes(appliedAfter.request.resourceSize)} |

The simulated score and the applied trace are separate measurement domains and are not added together.
`;
  fs.writeFileSync(path.join(evidenceRoot, 'summary.md'), markdown);
}

async function main() {
  const summary = {
    protocol: {
      lighthouse: '12.8.2',
      viewport: '412x823',
      deviceScaleFactor: 1.75,
      cpuSlowdownMultiplier: 4,
      url: 'http://localhost:4100/',
    },
    before: collectSimulated('before'),
    after: collectSimulated('after'),
    applied: {
      before: collectApplied('before'),
      after: collectApplied('after'),
    },
  };

  writeSummary(summary);
  await writeMetricsBoard(summary);
  await writeBreakdownBoard(summary);
  await writeFilmstripBoard(summary);
  await writeFinalScreenshotBoard(summary);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
