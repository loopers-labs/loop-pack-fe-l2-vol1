'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'

import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'

const DEFAULT_DEBOUNCE_MS = 300

type DebouncedInputProps = {
  initialValue: string
  onDebouncedChange: (value: string) => void
  debounceMs?: number
  label: ReactNode
  name: string
  placeholder?: string
  className?: string
}

export function DebouncedInput({
  initialValue,
  onDebouncedChange,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  label,
  name,
  placeholder,
  className,
}: DebouncedInputProps) {
  const [draft, setDraft] = useState(initialValue)
  const debounced = useDebouncedValue(draft, debounceMs)

  const onDebouncedChangeRef = useRef(onDebouncedChange)
  useEffect(() => {
    onDebouncedChangeRef.current = onDebouncedChange
  }, [onDebouncedChange])

  useEffect(() => {
    onDebouncedChangeRef.current(debounced)
  }, [debounced])

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
