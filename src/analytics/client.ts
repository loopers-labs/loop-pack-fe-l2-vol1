import { getCommonAnalyticsProperties } from './commonProperties'
import { consoleProvider } from './consoleProvider'
import {
  initAnalytics,
  registerProviders,
  resetAnalyticsForTest,
  setCommonProperties,
} from './logger'

let isClientAnalyticsConfigured = false
let clientAnalyticsInitialization: Promise<void> | null = null

export function ensureClientAnalyticsConfigured(): void {
  if (isClientAnalyticsConfigured) {
    return
  }

  registerProviders([consoleProvider])
  setCommonProperties(getCommonAnalyticsProperties)
  isClientAnalyticsConfigured = true
}

export function initializeClientAnalytics(): Promise<void> {
  ensureClientAnalyticsConfigured()

  if (clientAnalyticsInitialization === null) {
    clientAnalyticsInitialization = initAnalytics()
  }

  return clientAnalyticsInitialization
}

export function resetClientAnalyticsForTest(): void {
  isClientAnalyticsConfigured = false
  clientAnalyticsInitialization = null
  resetAnalyticsForTest()
}
