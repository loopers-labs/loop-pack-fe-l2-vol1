import { expect, test } from '@playwright/test'
import { saveObservation } from './observe'

const SETTLE_MS = 5000
const REAL_GRID = '.week05-grid:not([aria-hidden="true"])'

test('기존 목록을 더 짧은 결과로 갱신해도 CLS가 0.1을 넘지 않는다', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.addInitScript(() => {
    const layoutShiftState = globalThis as typeof globalThis & {
      __week07Cls: number
      __week07Shifts: Array<{
        value: number
        sources: Array<{
          node: string
          text: string
          previousX: number
          previousY: number
          previousWidth: number
          previousHeight: number
          currentX: number
          currentY: number
          currentWidth: number
          currentHeight: number
        }>
      }>
    }
    layoutShiftState.__week07Cls = 0
    layoutShiftState.__week07Shifts = []

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as PerformanceEntry & {
          value: number
          hadRecentInput: boolean
          sources: Array<{
            node: Node | null
            previousRect: DOMRectReadOnly
            currentRect: DOMRectReadOnly
          }>
        }
        if (!layoutShift.hadRecentInput) {
          layoutShiftState.__week07Cls += layoutShift.value
          layoutShiftState.__week07Shifts.push({
            value: layoutShift.value,
            sources: layoutShift.sources.map((source) => ({
              node:
                source.node instanceof Element
                  ? `${source.node.tagName.toLowerCase()}.${source.node.className}`
                  : 'unknown',
              text:
                source.node instanceof Element
                  ? (source.node.textContent?.trim().slice(0, 80) ?? '')
                  : '',
              previousX: source.previousRect.x,
              previousY: source.previousRect.y,
              previousWidth: source.previousRect.width,
              previousHeight: source.previousRect.height,
              currentX: source.currentRect.x,
              currentY: source.currentRect.y,
              currentWidth: source.currentRect.width,
              currentHeight: source.currentRect.height,
            })),
          })
        }
      }
    }).observe({ type: 'layout-shift', buffered: true })
  })

  await page.goto('/products')
  await expect(page.locator(REAL_GRID)).toBeVisible({ timeout: SETTLE_MS })

  const initialResult = await page.evaluate(() => {
    const layoutShiftState = globalThis as typeof globalThis & {
      __week07Cls: number
      __week07Shifts: Array<unknown>
    }
    const result = {
      cls: layoutShiftState.__week07Cls,
      shifts: layoutShiftState.__week07Shifts,
    }
    layoutShiftState.__week07Cls = 0
    layoutShiftState.__week07Shifts = []
    return result
  })

  await page.getByLabel('카테고리').selectOption('digital')
  await expect(page.locator(REAL_GRID)).toHaveAttribute('aria-busy', 'false', {
    timeout: SETTLE_MS,
  })

  const refreshResult = await page.evaluate(() => {
    const layoutShiftState = globalThis as typeof globalThis & {
      __week07Cls: number
      __week07Shifts: Array<unknown>
    }
    return {
      cls: layoutShiftState.__week07Cls,
      shifts: layoutShiftState.__week07Shifts,
    }
  })

  await saveObservation(info, {
    initialCls: initialResult.cls,
    initialShifts: initialResult.shifts,
    refreshCls: refreshResult.cls,
    refreshShifts: refreshResult.shifts,
  })

  expect(
    initialResult.cls,
    JSON.stringify(initialResult.shifts, null, 2),
  ).toBeLessThanOrEqual(0.1)
  expect(
    refreshResult.cls,
    JSON.stringify(refreshResult.shifts, null, 2),
  ).toBeLessThanOrEqual(0.1)
})
