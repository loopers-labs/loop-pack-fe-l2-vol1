const DEFAULT_API_TIMEOUT_MS = 5_000

export const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_API_TIMEOUT_MS,
): Promise<Response> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  const parentSignal = init.signal ?? undefined
  const abortFromParent = () => controller.abort()

  if (parentSignal !== undefined) {
    if (parentSignal.aborted) {
      controller.abort()
    } else {
      parentSignal.addEventListener('abort', abortFromParent, { once: true })
    }
  }

  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
    parentSignal?.removeEventListener('abort', abortFromParent)
  }
}
