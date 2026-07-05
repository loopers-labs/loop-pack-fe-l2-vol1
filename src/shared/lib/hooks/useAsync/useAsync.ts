import { useCallback, useEffect, useRef, useState } from 'react'

import type {
  UseAsyncOptions,
  UseAsyncResult,
  UseAsyncSelectOptions,
  UseAsyncStatus,
} from './types'

type AsyncState<TData> = {
  readonly data: TData | undefined
  readonly error: Error | null
  readonly status: UseAsyncStatus
}

const createUnknownError = () => new Error('알 수 없는 오류가 발생했습니다.')

const normalizeError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error
  }

  return createUnknownError()
}

const getInitialState = <TData>(
  initialData: TData | undefined,
): AsyncState<TData> => ({
  data: initialData,
  error: null,
  status: initialData === undefined ? 'idle' : 'success',
})

export function useAsync<TAsyncData>(
  options: UseAsyncOptions<TAsyncData>,
): UseAsyncResult<TAsyncData>

export function useAsync<TAsyncData, TData>(
  options: UseAsyncSelectOptions<TAsyncData, TData>,
): UseAsyncResult<TData>

export function useAsync<TAsyncData, TData = TAsyncData>({
  asyncFn,
  deps,
  enabled = true,
  initialData,
  keepPreviousData = false,
  selectFn,
  selectDeps = [],
  onSuccess,
  onError,
}:
  | UseAsyncOptions<TAsyncData>
  | UseAsyncSelectOptions<TAsyncData, TData>): UseAsyncResult<TData> {
  const asyncFnRef = useRef(asyncFn)
  const selectFnRef = useRef(selectFn)
  const initialDataRef = useRef(initialData as TData | undefined)
  const keepPreviousDataRef = useRef(keepPreviousData)
  const onSuccessRef = useRef<((data: TData) => void) | undefined>(
    onSuccess as ((data: TData) => void) | undefined,
  )
  const onErrorRef = useRef(onError)
  const rawDataRef = useRef<{ readonly data: TAsyncData } | null>(null)
  const latestRequestIdRef = useRef(0)
  const isMountedRef = useRef(false)
  const [state, setState] = useState(() =>
    getInitialState(initialData as TData | undefined),
  )

  useEffect(() => {
    asyncFnRef.current = asyncFn
  }, [asyncFn])

  useEffect(() => {
    selectFnRef.current = selectFn
  }, [selectFn])

  useEffect(() => {
    initialDataRef.current = initialData as TData | undefined
  }, [initialData])

  useEffect(() => {
    keepPreviousDataRef.current = keepPreviousData
  }, [keepPreviousData])

  useEffect(() => {
    onSuccessRef.current = onSuccess as ((data: TData) => void) | undefined
  }, [onSuccess])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
      latestRequestIdRef.current += 1
    }
  }, [])

  const selectData = useCallback((data: TAsyncData): TData => {
    const currentSelectFn = selectFnRef.current

    if (currentSelectFn !== undefined) {
      return currentSelectFn(data)
    }

    return data as unknown as TData
  }, [])

  const refetch = useCallback(async () => {
    const requestId = latestRequestIdRef.current + 1
    latestRequestIdRef.current = requestId

    if (!keepPreviousDataRef.current) {
      rawDataRef.current = null
    }

    setState((currentState) => ({
      data: keepPreviousDataRef.current
        ? currentState.data
        : initialDataRef.current,
      error: null,
      status: 'pending',
    }))

    try {
      const asyncData = await asyncFnRef.current()

      if (!isMountedRef.current || latestRequestIdRef.current !== requestId) {
        return undefined
      }

      rawDataRef.current = { data: asyncData }
      const data = selectData(asyncData)

      setState({ data, error: null, status: 'success' })
      onSuccessRef.current?.(data)

      return data
    } catch (unknownError) {
      const error = normalizeError(unknownError)

      if (!isMountedRef.current || latestRequestIdRef.current !== requestId) {
        return undefined
      }

      setState((currentState) => ({
        data: currentState.data,
        error,
        status: 'error',
      }))
      onErrorRef.current?.(error)

      return undefined
    }
  }, [selectData])

  useEffect(() => {
    if (rawDataRef.current === null) {
      return
    }

    const data = selectData(rawDataRef.current.data)

    setState((currentState) => ({
      data,
      error: currentState.error,
      status: currentState.status,
    }))
  }, [selectData, ...selectDeps])

  const reset = useCallback(() => {
    latestRequestIdRef.current += 1
    rawDataRef.current = null
    setState(getInitialState(initialDataRef.current))
  }, [])

  useEffect(() => {
    if (!enabled) {
      return
    }

    void refetch()
  }, [enabled, refetch, ...deps])

  return {
    data: state.data,
    error: state.error,
    status: state.status,
    isIdle: state.status === 'idle',
    isLoading: state.status === 'pending',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
    refetch,
    reset,
  }
}
