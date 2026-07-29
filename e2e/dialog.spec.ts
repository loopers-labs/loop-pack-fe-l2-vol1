import { expect, test, type Page } from '@playwright/test';

// jsdom엔 레이아웃이 없어 스크롤·스크롤바·히트테스트가 전부 가짜다.
// 여기서는 그 세 가지가 실제 브라우저에서 동작하는지만 얇게 검증한다.

function getScrollY(page: Page) {
  return page.evaluate(() => window.scrollY);
}

function getScrollbarWidth(page: Page) {
  return page.evaluate(
    () => window.innerWidth - document.documentElement.clientWidth,
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

  // overflow hidden은 프로그램 스크롤(scrollTo)은 막지 않으므로 유저 입력(휠)으로 검증한다
  await page.mouse.move(10, 10);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(200);
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

test('스크롤바 폭만큼 body padding이 보상되어 컨텐츠가 밀리지 않는다', async ({
  page,
}) => {
  await page.goto('/demos');

  // config의 ignoreDefaultArgs로 스크롤바를 살렸으므로 폭이 있어야 정상. 0이면 검증 불가 환경이다
  const scrollbarWidth = await getScrollbarWidth(page);
  test.skip(
    scrollbarWidth === 0,
    '스크롤바가 폭을 차지하지 않는 환경 — 보상할 대상이 없음',
  );

  const heading = page.getByRole('heading', { name: 'Commerce UI Kit' });
  const headingXBefore = (await heading.boundingBox())?.x;

  await page.getByRole('button', { name: '배송·교환 안내 보기' }).click();
  await expect(
    page.getByRole('heading', { name: '배송·교환 안내' }),
  ).toBeVisible();

  // 스크롤바가 사라진 자리를 padding이 정확히 메워 컨텐츠가 옆으로 밀리지 않는다
  expect(await getScrollbarWidth(page)).toBe(0);
  expect(await page.evaluate(() => document.body.style.paddingRight)).toBe(
    `${scrollbarWidth}px`,
  );
  expect((await heading.boundingBox())?.x).toBe(headingXBefore);

  await page.getByRole('button', { name: '확인' }).click();
  await expect(
    page.getByRole('heading', { name: '배송·교환 안내' }),
  ).toBeHidden();

  expect(await page.evaluate(() => document.body.style.paddingRight)).toBe('');
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
