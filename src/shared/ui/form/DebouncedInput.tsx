import type { ChangeEvent, ComponentProps } from 'react'
import { useEffect, useRef } from 'react'

const DEBOUNCED_INPUT_DELAY_MS = 400

type DebouncedInputProps = Omit<
  ComponentProps<'input'>,
  'defaultValue' | 'onChange' | 'value'
> & {
  readonly onValueChange: (value: string) => void
  readonly syncKey?: number | string
  readonly value: string
}

export function DebouncedInput({
  onValueChange,
  syncKey = 0,
  value,
  ...inputProps
}: DebouncedInputProps) {
  return (
    <DebouncedInputControl
      key={String(syncKey)}
      onValueChange={onValueChange}
      value={value}
      {...inputProps}
    />
  )
}

type DebouncedInputControlProps = Omit<DebouncedInputProps, 'syncKey'> & {
  readonly value: string
}

function DebouncedInputControl({
  onValueChange,
  value,
  ...inputProps
}: DebouncedInputControlProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimeoutIdRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const debounceTimeoutId = debounceTimeoutIdRef.current

    if (debounceTimeoutId !== undefined) {
      window.clearTimeout(debounceTimeoutId)
      debounceTimeoutIdRef.current = undefined
    }

    const input = inputRef.current
    if (input !== null && input.value !== value) {
      input.value = value
    }
  }, [value])

  useEffect(() => {
    return () => {
      const debounceTimeoutId = debounceTimeoutIdRef.current

      if (debounceTimeoutId !== undefined) {
        window.clearTimeout(debounceTimeoutId)
      }
    }
  }, [])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value

    const debounceTimeoutId = debounceTimeoutIdRef.current
    if (debounceTimeoutId !== undefined) {
      window.clearTimeout(debounceTimeoutId)
    }

    debounceTimeoutIdRef.current = window.setTimeout(() => {
      debounceTimeoutIdRef.current = undefined
      onValueChange(nextValue)
    }, DEBOUNCED_INPUT_DELAY_MS)
  }

  return (
    <input
      {...inputProps}
      ref={inputRef}
      defaultValue={value}
      onChange={handleChange}
    />
  )
}
