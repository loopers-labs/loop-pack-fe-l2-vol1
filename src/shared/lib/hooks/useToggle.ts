import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useState } from 'react'

export type UseToggleReturn = {
  value: boolean
  setValue: Dispatch<SetStateAction<boolean>>
  toggle: () => void
  setTrue: () => void
  setFalse: () => void
}

export function useToggle(initialValue = false): UseToggleReturn {
  const [value, setValue] = useState(initialValue)

  const toggle = useCallback(() => {
    setValue((current) => !current)
  }, [])

  const setTrue = useCallback(() => {
    setValue(true)
  }, [])

  const setFalse = useCallback(() => {
    setValue(false)
  }, [])

  return {
    value,
    setValue,
    toggle,
    setTrue,
    setFalse,
  }
}
