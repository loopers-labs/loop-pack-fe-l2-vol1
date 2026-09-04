'use client'

import { useEffect } from 'react'
import { consoleProvider } from '@/analytics/consoleProvider'
import { getCommonEventProperties, setAnalyticsUserId } from '@/analytics/browser-context'
import { initAnalytics, registerProviders, setCommonProperties } from '@/analytics/logger'
import { useCurrentUserId } from '@/entities/session'

export const AnalyticsInitializer = () => {
  const userId = useCurrentUserId()

  useEffect(() => {
    setAnalyticsUserId(userId)
  }, [userId])

  useEffect(() => {
    registerProviders([consoleProvider])
    setCommonProperties(getCommonEventProperties)
    void initAnalytics()
  }, [])

  return null
}
