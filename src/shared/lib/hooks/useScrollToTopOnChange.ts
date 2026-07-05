import { useEffect } from 'react'

type UseScrollToTopOnChangeOptions = {
  readonly behavior?: ScrollBehavior
  readonly enabled?: boolean
}

export function useScrollToTopOnChange(
  trigger: unknown,
  options: UseScrollToTopOnChangeOptions = {},
): void {
  const { behavior = 'smooth', enabled = true } = options

  useEffect(() => {
    if (!enabled || trigger === null || trigger === undefined) {
      return
    }

    window.scrollTo({ top: 0, behavior })
  }, [trigger, enabled, behavior])
}
