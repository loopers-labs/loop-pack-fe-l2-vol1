'use client'

import { useEffect } from 'react'
import { initializeClientAnalytics } from './client'

export function AnalyticsInitializer(): null {
  useEffect(() => {
    void initializeClientAnalytics()
  }, [])

  return null
}
