import { expect, test, type Page } from '@playwright/test';

// jsdom엔 레이아웃이 없어 스크롤·스크롤바·히트테스트가 전부 가짜다.
// 여기서는 그 세 가지가 실제 브라우저에서 동작하는지만 얇게 검증한다.

function getScrollY(page: Page) {
  return page.evaluate(() => window.scrollY);
}

// 휠 입력은 다음 프레임에 스크롤로 반영된다. 시간을 정하지 않고 프레임 두 개를 기다린다.
function waitForNextFrames(page: Page) {
  return page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      }),
  );
}

test('다이얼로그가 열리면 유저 스크롤이 실제로 잠기고, 닫히면 풀린다', async ({
  page,
}) => {
  await page.goto('/demos');

  // 전제: 페이지가 뷰포트보다 길어 스크롤 가능하다
  await page.evaluate(() => window.scrollTo(0, 200));
  expect(await getScrollY(page)).toBeGreaterThan(0);
  await page.evaluate(() => window.scrollTo(0, 0));

  await page.getByRole('button', { name: '배송·교환 안내 보기' }).click();
  await expect(
    page.getByRole('heading', { name: '배송·교환 안내' }),
  ).toBeVisible();

  const lockedScrollY = await getScrollY(page);

  // overflow hidden은 프로그램 스크롤(scrollTo)은 막지 않으므로 유저 입력(휠)으로 검증한다.
  // "일어나지 않았다"는 기다릴 신호가 없어, 휠이 반영됐을 프레임까지 기다린 뒤에 확인한다.
  await page.mouse.move(10, 10);
  await page.mouse.wheel(0, 500);
  await waitForNextFrames(page);
  expect(await getScrollY(page)).toBe(lockedScrollY);

  await page.getByRole('button', { name: '확인' }).click();
  await expect(
    page.getByRole('heading', { name: '배송·교환 안내' }),
  ).toBeHidden();

  const unlockedScrollY = await getScrollY(page);
  await page.mouse.move(10, 10);
  await page.mouse.wheel(0, 500);
  await expect.poll(() => getScrollY(page)).toBeGreaterThan(unlockedScrollY);
});

test('다이얼로그를 열어도 콘텐츠가 좌우로 밀리지 않는다', async ({ page }) => {
  await page.goto('/demos');

  const heading = page.getByRole('heading', { name: 'Commerce UI Kit' });
  const headingBoxBefore = await heading.boundingBox();
  if (!headingBoxBefore) {
    throw new Error('다이얼로그를 열기 전 콘텐츠 위치를 찾지 못했습니다');
  }

  await page.getByRole('button', { name: '배송·교환 안내 보기' }).click();
  await expect(
    page.getByRole('heading', { name: '배송·교환 안내' }),
  ).toBeVisible();

  const headingBoxAfter = await heading.boundingBox();
  if (!headingBoxAfter) {
    throw new Error('다이얼로그를 연 뒤 콘텐츠 위치를 찾지 못했습니다');
  }
  expect(headingBoxAfter.x).toBe(headingBoxBefore.x);
});

test('열린 다이얼로그(포탈)가 페이지 컨텐츠 위를 실제로 덮는다', async ({
  page,
}) => {
  await page.goto('/demos');

  const trigger = page.getByRole('button', { name: '배송·교환 안내 보기' });
  await trigger.click();
  await expect(
    page.getByRole('heading', { name: '배송·교환 안내' }),
  ).toBeVisible();

  // 히트테스트: 트리거 버튼 자리를 찍으면 버튼이 아니라 포탈(오버레이/컨텐츠)이 잡혀야 한다
  const triggerBox = await trigger.boundingBox();
  if (!triggerBox) {
    throw new Error('트리거 버튼의 위치를 찾지 못했습니다');
  }

  const isCovered = await page.evaluate(
    ({ x, y }) => {
      const hit = document.elementFromPoint(x, y);
      const buttons = Array.from(document.querySelectorAll('button'));
      const trigger = buttons.find((button) =>
        button.textContent?.includes('배송·교환 안내 보기'),
      );

      return hit !== null && trigger !== undefined && !trigger.contains(hit);
    },
    {
      x: triggerBox.x + triggerBox.width / 2,
      y: triggerBox.y + triggerBox.height / 2,
    },
  );

  expect(isCovered).toBe(true);
});
