'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'

const DEFAULT_DEBOUNCE_MS = 300

type DebouncedInputProps = {
  value: string
  onDebouncedChange: (value: string) => void
  debounceMs?: number
  label: ReactNode
  name: string
  placeholder?: string
  className?: string
}

export function DebouncedInput({
  value,
  onDebouncedChange,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  label,
  name,
  placeholder,
  className,
}: DebouncedInputProps) {
  const [prevValue, setPrevValue] = useState(value)
  const [draft, setDraft] = useState(value)

  // Sync draft to external value changes (browser nav, own emission
  // returning). Adjusting during render avoids a stale frame between
  // the value change and an effect firing.
  if (value !== prevValue) {
    setPrevValue(value)
    setDraft(value)
  }

  const onDebouncedChangeRef = useRef(onDebouncedChange)
  useEffect(() => {
    onDebouncedChangeRef.current = onDebouncedChange
  }, [onDebouncedChange])

  // When draft differs from value (the external source of truth),
  // schedule emission after a full debounceMs. Each draft change
  // resets the timer, so only the final settled value emits.
  useEffect(() => {
    if (draft === value) {
      return
    }
    const timer = setTimeout(() => {
      onDebouncedChangeRef.current(draft)
    }, debounceMs)
    return () => {
      clearTimeout(timer)
    }
  }, [draft, value, debounceMs])

  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-(--color-subtle)">{label}</span>
      <input
        type="text"
        name={name}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
        }}
        placeholder={placeholder}
        className={
          className ??
          'min-h-10 rounded border border-(--color-border) px-3 py-2 text-sm text-(--color-text)'
        }
      />
    </label>
  )
}
