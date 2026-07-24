import { chromium } from "playwright";

const expectedText = "Playwright CI ready";
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  await page.setContent(`<main data-ci-smoke="ready">${expectedText}</main>`);

  const renderedText = await page
    .locator('[data-ci-smoke="ready"]')
    .textContent();

  if (renderedText !== expectedText) {
    throw new Error(`Unexpected browser output: ${renderedText}`);
  }

  process.stdout.write(
    `Playwright CI smoke passed with Chromium ${browser.version()}\n`,
  );
} finally {
  await browser.close();
}
