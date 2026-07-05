import { useEffect, useState } from 'react'

// 값이 delayMs 동안 멈춘 뒤에야 갱신한다. 입력값(즉시 표시)과 요청값(디바운스)을 나눌 때 쓴다.
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debouncedValue
}
