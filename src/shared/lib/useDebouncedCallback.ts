import { useCallback, useEffect, useRef } from 'react'

export const useDebouncedCallback = <Arguments extends unknown[]>(
  callback: (...arguments_: Arguments) => void,
  delay: number,
) => {
  const callbackRef = useRef(callback)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const cancel = useCallback(() => {
    if (timeoutRef.current === null) return

    clearTimeout(timeoutRef.current)
    timeoutRef.current = null
  }, [])

  const run = useCallback(
    (...arguments_: Arguments) => {
      cancel()
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...arguments_)
        timeoutRef.current = null
      }, delay)
    },
    [cancel, delay],
  )

  useEffect(() => cancel, [cancel])

  return { run, cancel }
}
