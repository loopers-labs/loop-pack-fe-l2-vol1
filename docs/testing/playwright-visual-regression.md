# Playwright 시각 회귀 — 활성화 준비 handoff

이 문서는 `@playwright/test`가 아직 설치되지 않은 상태에서 시각 회귀(visual regression) 테스트를 **바로 활성화할 수 있게 준비해 둔 handoff 아티팩트**다. 의존성 설치·잠금 게이트 파일 편집·baseline 생성은 사람이 수행해야 하는 영역이라(이 저장소는 `pnpm add`/`pnpm install`과 `tsconfig`/`eslint.config`/CI 워크플로 편집을 AI에게 막아 둔다) config와 spec은 실제 `.ts` 파일이 아니라 이 문서의 코드블록으로만 전달한다. 실제 `playwright.config.ts`나 `e2e/*.spec.ts`를 지금 만들면 잠긴 `tsconfig.json`의 `include: **/*.ts`가 그 파일을 컴파일하려다 `Cannot find module '@playwright/test'`로 `pnpm typecheck` 게이트를 깨뜨린다 — markdown은 tsc/vitest/eslint가 스캔하지 않으므로 6게이트가 green으로 유지된다.

## 목적 · 도구 분담 요약

[`nextjs.md`](./nextjs.md#이-저장소의-e2e-분담)가 정한 이 저장소의 E2E 분담을 그대로 따른다 — **기능 E2E는 agent-browser**, **시각/디자인 회귀는 Playwright의 `toHaveScreenshot()`**. 픽셀 diff는 결정론이 생명이라 고정된 스크린샷 비교가 AI 주도 탐색보다 정확하다.

[`verification.md`](./verification.md#비주얼-회귀-playwright-기본-필요할-때만-유상-서비스)가 명시하는 원칙도 그대로 적용한다 — 폰트 렌더링과 OS별 안티앨리어싱 차이 때문에 로컬에서 만든 baseline은 CI 컨테이너에서 어긋나므로, **baseline은 CI와 동일한 컨테이너 환경에서 생성**해야 한다. 아래 `webServer` 설정이 `pnpm build && pnpm start`로 프로덕션 빌드를 띄우는 이유가 여기 있다 — `next dev`로 잡은 baseline은 HMR·미최적화 렌더링 때문에 CI가 빌드하는 프로덕션 결과물과 픽셀이 어긋난다.

이 저장소의 CI 컨테이너 환경이 baseline과 일치하는지는 **Unknown**이다 — `.github/workflows/ci.yml:10`은 `runs-on: ubuntu-latest`이고 `container:`를 지정하지 않는다. `.github/workflows/**`는 AI 편집이 차단돼 있어 이 저장소에서 정할 수 없다 — `README.md`의 "시각 회귀 테스트" 절에도 같은 활성 조건이 기록돼 있다. 활성화 시점에 사람이 다음 중 하나를 고른다: (a) `ci.yml`에 `container:`를 지정해 렌더 스택을 고정하거나, (b) baseline을 CI에서 `--update-snapshots`로 직접 생성한다.

대상 화면은 두 곳이다 — skin 3종(`src/products/skins/`)은 `/week-04`(`app/week-04/page.tsx`)에서 `ProductOptions`가 상품의 `optionKind`에 따라 렌더하는 표면 각각을 self-baseline으로 비교하고, 커머스 화면은 `/`(홈, `app/(commerce)/page.tsx`)와 `/products`(목록, `app/(commerce)/products/page.tsx`)를 각각 통짜 페이지로 비교한다.

## `playwright.config.ts` (완성본)

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    reducedMotion: "reduce",
    trace: "on-first-retry",
  },
  expect: {
    // 애니메이션/트랜지션을 꺼서 baseline이 프레임 타이밍에 따라 flaky해지는 것을 막는다.
    toHaveScreenshot: { animations: "disabled" },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // 반드시 프로덕션 빌드 위에서 baseline을 잡는다 — CI도 동일하게 build+start로 띄운다.
    command: "pnpm build && pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

## `e2e/skins-visual.spec.ts` (완성본)

```ts
import { test, expect } from "@playwright/test";

const skins = [
  { name: "size", group: "사이즈 선택" },
  { name: "thumbnail", group: "옵션 선택" },
  { name: "bundle", group: "구성 선택" },
];

for (const skin of skins) {
  test(`${skin.name} 스킨이 baseline과 픽셀 단위로 일치한다`, async ({ page }) => {
    await page.goto("/week-04");
    const surface = page.getByRole("group", { name: skin.group });
    await expect(surface).toBeVisible();
    await expect(surface).toHaveScreenshot(`${skin.name}-skin.png`);
  });
}
```

`group` 값은 각 skin 컴포넌트의 실제 접근성 표면과 일치한다 — `size-skin.tsx`/`thumbnail-skin.tsx`/`bundle-skin.tsx`가 각각 `role="group"` `aria-label="사이즈 선택"`/`"옵션 선택"`/`"구성 선택"`을 갖는다. 컴포넌트의 `aria-label`이 바뀌면 이 `group` 값도 함께 고쳐야 한다.

## `e2e/commerce-visual.spec.ts` (완성본)

```ts
import { test, expect } from "@playwright/test";

test("커머스 홈이 baseline과 픽셀 단위로 일치한다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("status", { name: "상품을 불러오는 중" })).toBeHidden();
  await expect(page).toHaveScreenshot("commerce-home.png", { fullPage: true });
});

test("상품 목록이 baseline과 픽셀 단위로 일치한다", async ({ page }) => {
  // q·category·sort·page 4개 URL 파라미터가 화면을 결정한다(use-list-query.ts) —
  // 어떤 조합을 찍는지 명시하지 않으면 baseline이 매번 다른 필터/정렬/페이지를 찍을 수 있다.
  // 여기서는 기본값 조합(전체 카테고리·최신순·1페이지)을 그대로 pin했다.
  await page.goto("/products?q=&category=all&sort=latest&page=1");
  await expect(page.getByRole("status", { name: "상품을 불러오는 중" })).toBeHidden();
  await expect(page).toHaveScreenshot("commerce-products.png", { fullPage: true });
});
```

두 화면 모두 TanStack Query로 데이터를 받아 첫 렌더가 `role="status"` 스켈레톤이다(`home-view.tsx`/`list-view.tsx`) — 로딩이 끝나 스켈레톤이 사라진 뒤에 스크린샷을 찍어야 baseline이 로딩 프레임을 찍는 flaky를 피한다.

## human 활성화 체크리스트

`vitest.config.mts`의 `test.exclude`에 `"e2e/**"`를 추가하는 항목은 이미 반영돼 있다(`exclude: [...defaultExclude, "e2e/**"]`) — vitest가 `*.spec.ts`를 자신의 테스트로 오인해 실행하지 않으므로, 아래 목록에서는 뺐다.

1. `pnpm add -D @playwright/test` — 의존성 설치 **(human 전용 — AI 편집 차단)**
2. `npx playwright install chromium` — 브라우저 바이너리 설치
3. `tsconfig.json`의 `exclude`에 `"e2e/**"` 추가 **(human 전용 — AI 편집 차단)** — 안 하면 tsc가 위 spec들을 컴파일하려다 `Cannot find module '@playwright/test'`로 실패한다
4. 위 세 코드블록을 실제 `playwright.config.ts`·`e2e/skins-visual.spec.ts`·`e2e/commerce-visual.spec.ts`로 저장한다
5. `.github/workflows/ci.yml`에 시각 회귀 job 추가 **(human 전용 — AI 편집 차단)** — `pnpm add -D @playwright/test` → `npx playwright install --with-deps chromium` → `pnpm build` → `npx playwright test`
6. `npx playwright test --update-snapshots`로 최초 baseline을 생성한다 — CI와 동일한 OS·브라우저 환경에서 잡아야 픽셀 차이가 나지 않는다
