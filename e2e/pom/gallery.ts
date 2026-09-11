import { expect, type Page } from '@playwright/test';
import type { StoryName } from '@/app/gallery/stories';

// 함수형 POM — 갤러리 조작은 이 파일에만 있다.
// story 이름은 레지스트리(src/app/gallery/stories.ts)의 키 타입으로 받아,
// 오타는 실행 전에 typecheck에서 걸린다.

export async function gotoGallery(page: Page) {
  await page.goto('/gallery');
  await expect(page).toHaveURL('/gallery');
  // window.mount는 hydration 뒤 effect에서 생긴다 — 그 전에 부르면 함수가 없다.
  await page.waitForFunction(() => typeof window.mount === 'function');
}

// story 하나를 그리고 그 루트 locator를 돌려준다. 스크린샷은 호출자가 찍는다.
export async function mountStory(page: Page, name: StoryName) {
  await page.evaluate((storyName) => {
    if (!window.mount) {
      throw new Error('갤러리가 아직 준비되지 않았다 (window.mount 없음)');
    }
    window.mount(storyName);
  }, name);
  return page.locator('#story-root');
}
