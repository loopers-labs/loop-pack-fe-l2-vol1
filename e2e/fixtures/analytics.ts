import type { Page } from '@playwright/test'

// consoleProvider가 window.__analytics에 쌓아 둔 이벤트를 읽는다.
// 이 버퍼는 문서마다 새로 만들어지므로, 이동하기 전에 읽어야 하는 값이 있다면 그 자리에서 읽는다.
export type AnalyticsEvent = {
  event: string
  properties: Record<string, unknown>
}

export const waitForAnalyticsEvent = async (
  page: Page,
  eventName: string,
): Promise<AnalyticsEvent> => {
  const handle = await page.waitForFunction(
    (name) => window.__analytics?.find((entry) => entry.event === name) ?? null,
    eventName,
  )
  const event = await handle.jsonValue()

  // waitForFunction은 값이 truthy가 될 때까지 기다리므로 여기서 null일 수 없다.
  // 타입에는 남아 있어 좁혀 준다.
  if (event === null) {
    throw new Error(`${eventName} 이벤트를 찾지 못했다.`)
  }

  return event
}

export const flowIdOf = (event: AnalyticsEvent): string => {
  const flowId = event.properties.flow_id

  if (typeof flowId !== 'string' || flowId === '') {
    throw new Error(`${event.event} 이벤트에 flow_id가 없다.`)
  }

  return flowId
}

// flow_id는 sessionStorage에 있다. 로그인 성공은 전체 이동을 일으켜 버퍼가 사라지므로,
// 이동 후에는 이벤트가 읽는 저장소 값을 직접 확인한다.
export const readStoredFlowId = (page: Page): Promise<string | null> =>
  page.evaluate(() => window.sessionStorage.getItem('commerce.analytics.flow-id'))
