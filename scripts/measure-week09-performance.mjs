import { chromium } from '@playwright/test';

const targetUrl = process.env.PERFORMANCE_URL ?? 'http://127.0.0.1:3100/';
const runCount = Number(process.env.PERFORMANCE_RUNS ?? 5);
const downloadThroughput = (1_474.56 * 1_024) / 8;
const uploadThroughput = (675 * 1_024) / 8;

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const rows = [];

for (let run = 1; run <= runCount; run += 1) {
  const context = await browser.newContext({
    viewport: { width: 412, height: 823 },
    deviceScaleFactor: 1.75,
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);

  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 562.5,
    downloadThroughput,
    uploadThroughput,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.addInitScript(() => {
    window.__week09Metrics = { cls: 0, lcp: 0, lcpElement: null, shifts: [] };

    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries.at(-1);
      if (lastEntry) {
        window.__week09Metrics.lcp = lastEntry.startTime;
        window.__week09Metrics.lcpElement =
          lastEntry.element instanceof Element
            ? `${lastEntry.element.tagName.toLowerCase()}.${lastEntry.element.className}`
            : null;
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          window.__week09Metrics.cls += entry.value;
          window.__week09Metrics.shifts.push({
            startTime: entry.startTime,
            value: entry.value,
            sources: entry.sources.map((source) => ({
              node:
                source.node instanceof Element
                  ? `${source.node.tagName.toLowerCase()}.${source.node.className}`
                  : null,
              previousRect: source.previousRect.toJSON(),
              currentRect: source.currentRect.toJSON(),
            })),
          });
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });

  await page.goto(targetUrl, { waitUntil: 'load', timeout: 60_000 });
  await page.locator('main img').first().evaluate(async (image) => {
    if (!image.complete) {
      await new Promise((resolve, reject) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', reject, { once: true });
      });
    }
    await document.fonts.ready;
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
  });

  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const fcp = performance.getEntriesByName('first-contentful-paint')[0];

    return {
      fcp: fcp?.startTime ?? null,
      lcp: window.__week09Metrics.lcp,
      cls: window.__week09Metrics.cls,
      lcpElement: window.__week09Metrics.lcpElement,
      shifts: window.__week09Metrics.shifts,
      responseStart: navigation?.responseStart ?? null,
    };
  });

  rows.push({ run, ...metrics });
  await context.close();
}

await browser.close();

const summarize = (key) => {
  const values = rows
    .map((row) => row[key])
    .filter((value) => typeof value === 'number')
    .sort((left, right) => left - right);
  return {
    median: values[Math.floor(values.length / 2)],
    min: values[0],
    max: values.at(-1),
  };
};

console.log(
  JSON.stringify(
    {
      measuredAt: new Date().toISOString(),
      targetUrl,
      conditions: {
        viewport: { width: 412, height: 823, deviceScaleFactor: 1.75 },
        requestLatencyMs: 562.5,
        downloadThroughputKbps: 1_474.56,
        uploadThroughputKbps: 675,
        cpuSlowdownMultiplier: 4,
        cacheDisabled: true,
      },
      rows,
      summary: {
        fcp: summarize('fcp'),
        lcp: summarize('lcp'),
        cls: summarize('cls'),
        responseStart: summarize('responseStart'),
      },
    },
    null,
    2,
  ),
);
